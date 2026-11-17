import Link from "next/link";
import { ArrowRight, CheckCircle2, Heart, Store } from "lucide-react";
import { demoProducts } from "@/lib/demo";
import { demoBuyerEvidence, demoBuyerPosts } from "@/lib/demo-buyer-stories";
import { platformLabels, furnitureFindPath } from "@/lib/discovery-links";
import { money } from "@/lib/budget";
import { BookmarkFurniture } from "./bookmark-furniture";
import { DeliveryHistory } from "./delivery-history";
import { RoomReadyBrand } from "./roomready-brand";
import { SocialSourceIcon } from "./social-source-icon";

const feedPosts = demoBuyerPosts.flatMap(post => {
  const product = demoProducts.find(item => item.id === post.productId);
  return product ? [{ post, product }] : [];
});

const merchantPosts = new Map<string, string>();
for (const { post, product } of feedPosts) {
  if (!merchantPosts.has(product.merchant)) merchantPosts.set(product.merchant, post.id);
}
const merchantShortcuts = [...merchantPosts].sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }));

export function DiscoveryFeed({ entry }: { entry?: "assistant" | "shared" }) {
  return <>
    <header className="site-header feed-site-header"><div className="site-inner">
      <RoomReadyBrand />
      <span className="mode-label">Demo Mode</span>
    </div></header>
    <main className="site-inner discovery-feed">
      <div className="feed-heading">
        <h1 className="sr-only">Home</h1>
        <h2 className="merchant-shortcuts-heading" id="popular-merchants">Popular merchants</h2>
        <ul className="merchant-shortcuts" aria-labelledby="popular-merchants">
          {merchantShortcuts.map(([merchant, postId]) => <li key={merchant}>
            <a href={`#post-${postId}`}>
              <span className="merchant-ring" aria-hidden="true"><span className="buyer-avatar"><Store size={22} /></span></span>
              {merchant}
            </a>
          </li>)}
        </ul>
      </div>
      <section className="feed-stream" aria-label="Buyer feed">
        {entry && <article className="feed-entry">
          <h2>{entry === "assistant" ? "Sample AI recommendation" : "Sample shared conversation"}</h2>
          <p>{entry === "assistant"
            ? "“The Marlow Low Sofa is $749 in pebble twill. Here’s where you can see what buyers said and check it against your space.”"
            : "“I thought of your apartment when I saw the Marlow. Here’s a link to try it in your room.”"}</p>
          <Link className="button primary" href={furnitureFindPath("demo-sofa-5", entry)}>Try the Marlow in my room <ArrowRight size={16} /></Link>
        </article>}
        {feedPosts.map(({ post, product }) => {
          const { count, likes, posts } = demoBuyerEvidence(product.id);
          const otherPosts = posts.filter(candidate => candidate.id !== post.id);
          return <article id={`post-${post.id}`} key={post.id} className="feed-post" aria-labelledby={`post-title-${post.id}`}>
            <header>
              <div className="buyer-avatar" aria-hidden="true">{post.buyer[0]}</div>
              <div className="buyer-byline"><strong>{post.buyer}</strong><span>{post.context}</span></div>
              <span className="feed-platform"><SocialSourceIcon platform={post.platform} size={14} /> Source: {platformLabels[post.platform]} · Sample post</span>
            </header>
            <img className="feed-product-image" src={product.image} alt={`${product.title} in ${product.variant}`} />
            <div className="feed-post-engagement">
              <div className="feed-engagement-stats">
                <p className="feed-proof"><CheckCircle2 size={15} /> <strong>{count} verified buyers</strong><span>Sample purchase data</span></p>
                {likes && <p className="buyer-like-note"><Heart size={14} /> {likes} sample likes</p>}
              </div>
              <BookmarkFurniture productId={product.id} name={product.title} platform={post.platform} />
            </div>
            <div className="feed-post-body">
              <div className="feed-product-details"><strong>{product.title}</strong><span>{product.merchant} · {product.variant}</span></div>
              <dl className="feed-product-facts">
                <div><dt>Price before shipping</dt><dd>{money(product.price)}</dd></div>
                <div><dt>Width × depth</dt><dd>{product.dimensions ? `${product.dimensions.width} × ${product.dimensions.depth} in` : "Size unavailable"}</dd></div>
                <DeliveryHistory merchant={product.merchant} />
              </dl>
              <h2 id={`post-title-${post.id}`}>{post.topic}</h2>
              <div className="feed-buyer-comment">
                <small>Sample buyer comment</small>
                <blockquote>“{post.quote}”</blockquote>
              </div>
              {post.delivery && <p className="feed-delivery-report"><strong>Sample delivery · {post.delivery.method === "express" ? "Express" : "Standard"}</strong>
                <span>Quoted by day {post.delivery.quotedDays} · Arrived day {post.delivery.arrivedDays} (business days)</span></p>}
              {otherPosts.length > 0 && <div className="feed-other-posts">More buyer posts {otherPosts.map(other =>
                <a key={other.id} href={`#post-${other.id}`}><SocialSourceIcon platform={other.platform} size={13} />{other.buyer} on {platformLabels[other.platform]} <ArrowRight size={12} aria-hidden="true" /></a>)}</div>}
              <Link className="button primary feed-action" href={furnitureFindPath(product.id, "social", post.platform)}>
                Try it in my room <ArrowRight size={16} />
              </Link>
            </div>
          </article>;
        })}
      </section>
    </main>
  </>;
}
