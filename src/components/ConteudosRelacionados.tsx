import { useEffect } from "react";

import { PostCard, type PostResumo } from "@/components/PostCard";
import { registrarEvento } from "@/lib/analytics-relacionados";

type Props = {
  slugPost: string;
  posts: PostResumo[];
  titulo?: string;
  className?: string;
};

/** Conteúdos relacionados por relevância temática (não por data). */
export function ConteudosRelacionados({
  slugPost,
  posts,
  titulo = "Conteúdos relacionados",
  className,
}: Props) {
  useEffect(() => {
    posts.forEach((post, position) =>
      registrarEvento("related_post_view", {
        post_id: slugPost,
        related_post_id: post.slug,
        position,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugPost, posts]);

  if (posts.length === 0) return null;

  return (
    <section className={className} aria-labelledby="conteudos-relacionados">
      <h2 id="conteudos-relacionados" className="text-lg font-semibold uppercase">
        {titulo}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, position) => (
          <div
            key={post.slug}
            onClickCapture={() =>
              registrarEvento("related_post_click", {
                post_id: slugPost,
                related_post_id: post.slug,
                position,
              })
            }
          >
            <PostCard post={post} />
          </div>
        ))}
      </div>
    </section>
  );
}
