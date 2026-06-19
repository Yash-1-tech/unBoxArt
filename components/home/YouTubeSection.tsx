import Link from 'next/link';

const videos = [
  {
    id: '1',
    thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80',
    title: 'Lorem Ipsum is simply dummy text',
    description:
      'of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type.',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: '2',
    thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&q=80',
    title: 'Lorem Ipsum is simply dummy text',
    description:
      'of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type.',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: '3',
    thumbnail: 'https://images.unsplash.com/photo-1547826039-bdbefef2de38?w=600&q=80',
    title: 'Lorem Ipsum is simply dummy text',
    description:
      'of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type.',
    youtubeId: 'dQw4w9WgXcQ',
  },
];

export default function YouTubeSection() {
  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="section-header">
          <h2 className="section-title">Latest YouTube Updates</h2>
          <Link href="https://youtube.com" target="_blank" className="view-all-link">
            View All &rsaquo;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <a
              key={video.id}
              href={`https://youtube.com/watch?v=${video.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="relative aspect-video overflow-hidden bg-gray-100 mb-3">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-[#e63329] transition-colors">
                {video.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{video.description}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
