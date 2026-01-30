"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Instagram, ExternalLink, X, Play } from "lucide-react";
import { INSTAGRAM_POSTS, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/instagram-posts";
import { motion, AnimatePresence } from "motion/react";

// Instagram embed component
function InstagramEmbed({ shortcode, onClose }: { shortcode: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const postUrl = `https://www.instagram.com/p/${shortcode}/`;

  useEffect(() => {
    // Load Instagram embed script
    // NOTE: SRI (Subresource Integrity) cannot be applied here because Instagram's
    // embed.js is dynamically generated and changes frequently. The script content
    // varies based on Instagram's releases, making a stable hash impossible.
    // Security is maintained via CSP which restricts script sources.
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-expect-error Instagram global
      if (window.instgrm) {
        // @ts-expect-error Instagram global
        window.instgrm.Embeds.process();
      }
      setLoading(false);
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [shortcode]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-auto max-w-[540px] max-h-[90vh] overflow-auto bg-white rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Instagram embed */}
        <div className="instagram-embed-container">
          {loading && (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
            </div>
          )}
          <blockquote
            className="instagram-media"
            data-instgrm-captioned
            data-instgrm-permalink={postUrl}
            data-instgrm-version="14"
            style={{
              background: "#FFF",
              border: 0,
              borderRadius: "3px",
              boxShadow: "none",
              margin: "0",
              maxWidth: "100%",
              minWidth: "100%",
              padding: 0,
            }}
          >
            <a href={postUrl} target="_blank" rel="noopener noreferrer">
              View on Instagram
            </a>
          </blockquote>
        </div>

        {/* Link to Instagram */}
        <div className="p-4 border-t border-neutral-200">
          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm font-medium text-navy hover:text-sky transition-colors"
          >
            <Instagram className="h-4 w-4" />
            View on Instagram
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Post thumbnail that shows a preview and opens modal
function PostThumbnail({
  post,
  index,
  onClick
}: {
  post: typeof INSTAGRAM_POSTS[0];
  index: number;
  onClick: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  // Fallback gradient colors
  const colors = [
    "from-sky/20 to-navy/20",
    "from-navy/20 to-sky/20",
    "from-grass/20 to-navy/20",
    "from-navy/20 to-grass/20",
    "from-sky/20 to-grass/20",
    "from-grass/20 to-sky/20",
  ];

  const hasImage = post.thumbnailUrl && !imageError;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="group relative aspect-square bg-neutral-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {/* Thumbnail image or gradient fallback */}
      {hasImage ? (
        <Image
          src={post.thumbnailUrl!}
          alt={`Instagram post ${index + 1}`}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          sizes="(max-width: 640px) 50vw, 33vw"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${colors[index % colors.length]}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Instagram className="h-8 w-8 text-navy/40 mx-auto mb-2" />
              <span className="text-xs text-navy/60 font-medium">Post {index + 1}</span>
            </div>
          </div>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/70 transition-colors duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center">
          <Play className="h-10 w-10 mx-auto mb-2" />
          <span className="text-sm font-medium">View Post</span>
        </div>
      </div>
    </motion.button>
  );
}

export default function GalleryPage() {
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  return (
    <>
      {/* Hero */}
      <section className="bg-navy py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/70">
              Gallery
            </p>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              See Us In
              <br />
              <span className="text-sky">Action</span>
            </h1>
            <p className="mt-6 text-lg text-white/70">
              Real moments from our sessions. Real smiles. Real progress.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="mr-2 h-5 w-5" />
                  Follow @{INSTAGRAM_HANDLE}
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Instagram Feed */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-5xl">
            {/* Post Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {INSTAGRAM_POSTS.map((post, index) => (
                <PostThumbnail
                  key={post.id}
                  post={post}
                  index={index}
                  onClick={() => setSelectedPost(post.shortcode)}
                />
              ))}
            </div>

            {/* View More on Instagram */}
            <div className="mt-12 text-center">
              <p className="text-neutral-500 mb-4">
                Follow us for more training highlights, match day moments, and celebrations
              </p>
              <Button asChild variant="secondary" size="lg">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="mr-2 h-5 w-5" />
                  See All Posts on Instagram
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-neutral-50 py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
              Ready To
              <br />
              <span className="text-navy">Join The Fun?</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Book a session and they could be in our next post!
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="rounded-none uppercase tracking-wider font-semibold"
                asChild
              >
                <Link href="/sessions">
                  Book a Session
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Instagram Modal */}
      <AnimatePresence>
        {selectedPost && (
          <InstagramEmbed
            shortcode={selectedPost}
            onClose={() => setSelectedPost(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
