// Shared anonymous statistics API for the GitHub Pages homepage.
export const visitorStatistics = {
  enabled: true,
  endpoint: 'https://ozaakbkoskdwpwumgaad.supabase.co/functions/v1/visitors',
  recentEndpoint: 'https://ozaakbkoskdwpwumgaad.supabase.co/functions/v1/homepage-public-recent-visitors',
  snapshot: './visitor-snapshot.json',
  publishedSnapshot: 'https://elliott-xiaowei-zhang.github.io/visitor-snapshot.json',
};
