import { Link } from "@tanstack/react-router";

import { formatDate, imageForKey, type Post } from "@/lib/catalog";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="card-lift flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <Link to="/blog/$slug" params={{ slug: post.slug }} className="bg-ink">
        <img
          src={imageForKey(post.imagem)}
          alt={post.titulo}
          loading="lazy"
          width={1024}
          height={1024}
          className="aspect-[16/10] w-full object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow text-gold">{post.categoria}</p>
        <h3 className="mt-2 text-lg font-semibold leading-snug">
          <Link
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="hover:text-primary"
          >
            {post.titulo}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {post.resumo}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          {formatDate(post.data)}
        </p>
      </div>
    </article>
  );
}
