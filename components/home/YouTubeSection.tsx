const videos = [
  {
    id: '1',
    youtubeId: 'REPLACE_WITH_REAL_VIDEO_ID',
    title: 'Behind the Canvas',
    description:
      'Artist stories, studio visits, and the creative process behind original artwork.',
  },
  {
    id: '2',
    youtubeId: 'REPLACE_WITH_REAL_VIDEO_ID',
    title: 'Art Care & Collection Guide',
    description:
      'Practical guides for displaying, storing, and caring for your artwork.',
  },
  {
    id: '3',
    youtubeId: 'REPLACE_WITH_REAL_VIDEO_ID',
    title: 'Inside Unboxarts',
    description:
      'Updates, stories, and insights from the artists and people behind Unboxarts.',
  },
];

export default function YouTubeSection() {
  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="section-header">
          <h2 className="section-title">
            Latest YouTube Updates
          </h2>

          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="view-all-link"
          >
            View All &rsaquo;
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            const youtubeUrl =
              `https://www.youtube.com/watch?v=${video.youtubeId}`;

            const thumbnailUrl =
              `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;

            return (
              <a
                key={video.id}
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="relative aspect-video overflow-hidden bg-gray-100 mb-3">
                  <img
                    src={thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                      <svg
                        className="w-6 h-6 text-white ml-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-[#e63329] transition-colors">
                  {video.title}
                </h3>

                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {video.description}
                </p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}