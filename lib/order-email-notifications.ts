import 'server-only';

import mongoose from 'mongoose';

import { connectDB } from '@/lib/db';
import Order from '@/models/Order';

import {
  sendOrderConfirmationEmail,
  sendNewOrderNotificationEmail,
} from '@/lib/email';

type PaymentMethod =
  | 'razorpay'
  | 'upi'
  | 'netbanking'
  | 'cod';

type Person = {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
};

type PopulatedArtwork = {
  _id: mongoose.Types.ObjectId;
  title?: string;
  artist?: Person | null;
};

type PopulatedOrderItem = {
  artwork: PopulatedArtwork | null;
  type: 'original' | 'digital_print';
  quantity: number;
  price: number;
};

type NotificationState = {
  artist: mongoose.Types.ObjectId;
  status: string;
  attempts: number;
};

type PopulatedOrder = {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  buyer: Person | null;
  items: PopulatedOrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  orderStatus: string;
  refundStatus?: string;
  emailNotifications?: {
    artistSales?: NotificationState[];
  };
};

type ArtistRecipient = {
  id: string;
  artistId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  artworkTitles: string[];
  subtotal: number;
};

const MAX_DELIVERY_ATTEMPTS = 5;
const DELIVERY_LEASE_MS = 2 * 60 * 1000;

function notificationEligibility(order: PopulatedOrder) {
  const orderInactive =
    order.orderStatus === 'cancelled' ||
    order.orderStatus === 'returned' ||
    order.paymentStatus === 'failed' ||
    order.paymentStatus === 'refunded' ||
    Boolean(order.refundStatus);

  if (orderInactive) {
    return {
      buyer: false,
      artists: false,
    };
  }

  const buyer =
    order.paymentMethod === 'cod' ||
    order.paymentMethod === 'upi' ||
    order.paymentMethod === 'netbanking' ||
    (
      order.paymentMethod === 'razorpay' &&
      order.paymentStatus === 'paid'
    );

  const artists =
    order.paymentMethod === 'cod' ||
    order.paymentStatus === 'paid';

  return { buyer, artists };
}

function getArtistRecipients(
  items: PopulatedOrderItem[]
): ArtistRecipient[] {
  const recipients = new Map<string, ArtistRecipient>();

  for (const item of items) {
    const artwork = item.artwork;
    const artist = artwork?.artist;

    if (!artwork || !artist?._id) {
      continue;
    }

    const artistId = artist._id.toString();

    let recipient = recipients.get(artistId);

    if (!recipient) {
      recipient = {
        id: artistId,
        artistId: new mongoose.Types.ObjectId(artistId),
        name: artist.name || 'Artist',
        email: artist.email || '',
        artworkTitles: [],
        subtotal: 0,
      };

      recipients.set(artistId, recipient);
    }

    const title = artwork.title || 'Artwork';

    if (!recipient.artworkTitles.includes(title)) {
      recipient.artworkTitles.push(title);
    }

    const lineTotal =
      Number(item.price) * Number(item.quantity);

    if (Number.isFinite(lineTotal) && lineTotal >= 0) {
      recipient.subtotal += lineTotal;
    }
  }

  return [...recipients.values()];
}


async function claimBuyerNotification(
  orderId: string
): Promise<Date | null> {
  const now = new Date();

  const leaseUntil = new Date(
    now.getTime() + DELIVERY_LEASE_MS
  );

  const claimed = await Order.findOneAndUpdate(
    {
      _id: orderId,

      'emailNotifications.buyerConfirmation.attempts': {
        $lt: MAX_DELIVERY_ATTEMPTS,
      },

      $or: [
        {
          'emailNotifications.buyerConfirmation.status': {
            $in: ['pending', 'failed'],
          },
        },
        {
          'emailNotifications.buyerConfirmation.status':
            'sending',

          'emailNotifications.buyerConfirmation.leaseUntil': {
            $lte: now,
          },
        },
      ],
    },
    {
      $set: {
        'emailNotifications.buyerConfirmation.status':
          'sending',

        'emailNotifications.buyerConfirmation.lastAttemptAt':
          now,

        'emailNotifications.buyerConfirmation.leaseUntil':
          leaseUntil,
      },

      $unset: {
        'emailNotifications.buyerConfirmation.lastError': 1,
      },

      $inc: {
        'emailNotifications.buyerConfirmation.attempts': 1,
      },
    },
    { new: true }
  ).select('_id');

  return claimed ? leaseUntil : null;
}

async function finishBuyerNotification(
  orderId: string,
  leaseUntil: Date,
  sent: boolean,
  error?: string
): Promise<void> {
  const base =
    'emailNotifications.buyerConfirmation';

  if (sent) {
    await Order.updateOne(
      {
        _id: orderId,
        [`${base}.status`]: 'sending',
        [`${base}.leaseUntil`]: leaseUntil,
      },
      {
        $set: {
          [`${base}.status`]: 'sent',
          [`${base}.sentAt`]: new Date(),
        },

        $unset: {
          [`${base}.leaseUntil`]: 1,
          [`${base}.lastError`]: 1,
        },
      }
    );

    return;
  }

  await Order.updateOne(
    {
      _id: orderId,
      [`${base}.status`]: 'sending',
      [`${base}.leaseUntil`]: leaseUntil,
    },
    {
      $set: {
        [`${base}.status`]: 'failed',
        [`${base}.lastError`]: (
          error || 'Email delivery was unsuccessful.'
        ).slice(0, 1000),
      },

      $unset: {
        [`${base}.leaseUntil`]: 1,
      },
    }
  );
}


async function claimArtistNotification(
  orderId: string,
  artistId: mongoose.Types.ObjectId
): Promise<Date | null> {
  const now = new Date();

  const leaseUntil = new Date(
    now.getTime() + DELIVERY_LEASE_MS
  );

  const claimed = await Order.findOneAndUpdate(
    {
      _id: orderId,

      'emailNotifications.artistSales': {
        $elemMatch: {
          artist: artistId,

          attempts: {
            $lt: MAX_DELIVERY_ATTEMPTS,
          },

          $or: [
            {
              status: {
                $in: ['pending', 'failed'],
              },
            },
            {
              status: 'sending',
              leaseUntil: {
                $lte: now,
              },
            },
          ],
        },
      },
    },
    {
      $set: {
        'emailNotifications.artistSales.$.status':
          'sending',

        'emailNotifications.artistSales.$.lastAttemptAt':
          now,

        'emailNotifications.artistSales.$.leaseUntil':
          leaseUntil,
      },

      $unset: {
        'emailNotifications.artistSales.$.lastError': 1,
      },

      $inc: {
        'emailNotifications.artistSales.$.attempts': 1,
      },
    },
    { new: true }
  ).select('_id');

  return claimed ? leaseUntil : null;
}

async function finishArtistNotification(
  orderId: string,
  artistId: mongoose.Types.ObjectId,
  leaseUntil: Date,
  sent: boolean,
  error?: string
): Promise<void> {
  const arrayFilter = {
    _id: orderId,

    emailNotifications: {
      $exists: true,
    },

    'emailNotifications.artistSales': {
      $elemMatch: {
        artist: artistId,
        status: 'sending',
        leaseUntil,
      },
    },
  };

  if (sent) {
    await Order.updateOne(
      arrayFilter,
      {
        $set: {
          'emailNotifications.artistSales.$.status':
            'sent',

          'emailNotifications.artistSales.$.sentAt':
            new Date(),
        },

        $unset: {
          'emailNotifications.artistSales.$.leaseUntil': 1,
          'emailNotifications.artistSales.$.lastError': 1,
        },
      }
    );

    return;
  }

  await Order.updateOne(
    arrayFilter,
    {
      $set: {
        'emailNotifications.artistSales.$.status':
          'failed',

        'emailNotifications.artistSales.$.lastError': (
          error || 'Email delivery was unsuccessful.'
        ).slice(0, 1000),
      },

      $unset: {
        'emailNotifications.artistSales.$.leaseUntil': 1,
      },
    }
  );
}


export async function dispatchOrderEmails(
  orderId: string
): Promise<void> {
  try {
    await connectDB();

    const rawOrder = await Order.findById(orderId)
      .populate({
        path: 'buyer',
        select: 'name email',
      })
      .populate({
        path: 'items.artwork',
        select: 'title artist',
        populate: {
          path: 'artist',
          select: 'name email',
        },
      })
      .exec();

    if (!rawOrder) {
      console.warn(
        '[Order email dispatcher] Order not found:',
        orderId
      );

      return;
    }

    const order =
      rawOrder as unknown as PopulatedOrder;

    const eligibility =
      notificationEligibility(order);

    if (!eligibility.buyer && !eligibility.artists) {
      return;
    }


    if (eligibility.buyer) {
      const leaseUntil =
        await claimBuyerNotification(orderId);

      if (leaseUntil) {
        try {
          const buyer = order.buyer;

          if (!buyer?.email) {
            throw new Error(
              'Buyer email address is unavailable.'
            );
          }

          const emailItems = order.items.map((item) => ({
            title: item.artwork?.title || 'Artwork',

            price: item.price * item.quantity,

            type: item.type,
          }));

          const sent = await sendOrderConfirmationEmail(
            buyer.email,
            buyer.name || 'Customer',
            order.orderNumber,
            emailItems,
            order.total,
            order.paymentMethod,
            `unboxart-order-${orderId}-buyer-v1`
          );

          await finishBuyerNotification(
            orderId,
            leaseUntil,
            sent,
            sent
              ? undefined
              : 'Resend did not accept the buyer notification.'
          );
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Unknown buyer notification error';

          console.error(
            '[Buyer order notification]',
            message
          );

          await finishBuyerNotification(
            orderId,
            leaseUntil,
            false,
            message
          ).catch((updateError) => {
            console.error(
              '[Buyer notification state update]',
              updateError
            );
          });
        }
      }
    }

    if (!eligibility.artists) {
      return;
    }

    const recipients = getArtistRecipients(
      order.items
    );

    for (const recipient of recipients) {
      const leaseUntil =
        await claimArtistNotification(
          orderId,
          recipient.artistId
        );

      if (!leaseUntil) {
        continue;
      }

      try {
        if (!recipient.email) {
          throw new Error(
            `Artist email is unavailable for artist ${recipient.id}.`
          );
        }

        const artworkTitle =
          recipient.artworkTitles.join(', ') ||
          'Artwork';

        const sent =
          await sendNewOrderNotificationEmail(
            recipient.email,
            recipient.name,
            order.orderNumber,
            artworkTitle.slice(0, 500),
            order.buyer?.name || 'Customer',
            recipient.subtotal,
            order.paymentMethod,
            `unboxart-order-${orderId}-artist-${recipient.id}-v1`
          );

        await finishArtistNotification(
          orderId,
          recipient.artistId,
          leaseUntil,
          sent,
          sent
            ? undefined
            : 'Resend did not accept the artist notification.'
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unknown artist notification error';

        console.error(
          '[Artist order notification]',
          {
            orderId,
            artistId: recipient.id,
            error: message,
          }
        );

        await finishArtistNotification(
          orderId,
          recipient.artistId,
          leaseUntil,
          false,
          message
        ).catch((updateError) => {
          console.error(
            '[Artist notification state update]',
            updateError
          );
        });
      }
    }
  } catch (error) {
    console.error(
      '[Order email dispatcher]',
      error instanceof Error
        ? error.message
        : error
    );
  }
}