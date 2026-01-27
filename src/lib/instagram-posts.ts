// Instagram posts data
// Real posts scraped from @takethenextstep121

export interface InstagramPost {
  id: string;
  postUrl: string;
  shortcode: string;
  // Optional: Add local thumbnail by saving image to /public/instagram/{shortcode}.jpg
  // The gallery will automatically display it if the file exists
  thumbnailUrl?: string;
}

// Latest 6 posts from Instagram (scraped January 2026)
// To add thumbnails:
// 1. Open each post on Instagram
// 2. Right-click the image and "Save Image As"
// 3. Save to /public/instagram/ folder as {shortcode}.jpg (e.g., DJ62W7po96j.jpg)
export const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: "1",
    postUrl: "https://www.instagram.com/takethenextstep121/p/DJ62W7po96j/",
    shortcode: "DJ62W7po96j",
    thumbnailUrl: "/instagram/DJ62W7po96j.jpg",
  },
  {
    id: "2",
    postUrl: "https://www.instagram.com/takethenextstep121/p/DT2hF8CCHPM/",
    shortcode: "DT2hF8CCHPM",
    thumbnailUrl: "/instagram/DT2hF8CCHPM.jpg",
  },
  {
    id: "3",
    postUrl: "https://www.instagram.com/takethenextstep121/p/DThjoomjH66/",
    shortcode: "DThjoomjH66",
    thumbnailUrl: "/instagram/DThjoomjH66.jpg",
  },
  {
    id: "4",
    postUrl: "https://www.instagram.com/takethenextstep121/p/DTLXoMkiLHu/",
    shortcode: "DTLXoMkiLHu",
    thumbnailUrl: "/instagram/DTLXoMkiLHu.jpg",
  },
  {
    id: "5",
    postUrl: "https://www.instagram.com/takethenextstep121/p/DS95Y99iJtT/",
    shortcode: "DS95Y99iJtT",
    thumbnailUrl: "/instagram/DS95Y99iJtT.jpg",
  },
  {
    id: "6",
    postUrl: "https://www.instagram.com/takethenextstep121/p/DScU16CiDVk/",
    shortcode: "DScU16CiDVk",
    thumbnailUrl: "/instagram/DScU16CiDVk.jpg",
  },
];

// Instagram handle
export const INSTAGRAM_HANDLE = "takethenextstep121";
export const INSTAGRAM_URL = "https://instagram.com/takethenextstep121";
