import Link from "next/link";
import { ArrowRight, Camera, CheckCircle2, Film, MessageCircle, Sofa, Sparkles } from "lucide-react";
import { demoInventory } from "@/lib/demo";
import { demoBuyerEvidence, demoBuyerPosts } from "@/lib/demo-buyer-stories";
import { platformLabels, sofaFindPath } from "@/lib/discovery-links";
import { money } from "@/lib/budget";

export function DiscoveryFeed({ entry }: { entry?: "assistant" | "shared" }) {
  return <>
    <header className="site-header"><div className="site-inner">
      <Link className="brand" href="/"><span className="brand-mark"><Sofa size={23} strokeWidth={1.85} /></span><span>Room<span className="brand-accent">Ready</span></span></Link>
      <Link className="button outline" href="/?setup=1">My room <ArrowRight size={15} /></Link>
    </div></header>
    <main className="site-inner discovery-feed">
      <aside className="feed-intro">
        <h1>See how buyers <em>live with it.</em></h1>
        <p>Browse sofas from buyer posts. Find one you like and try it in your own room before you buy.</p>
        <div className="feed-entry-links">
          <Link className="button outline" href="/demo/discovery?source=assistant"><Sparkles size={16} /> Open a sample AI chat</Link>
          <Link className="button outline" href="/demo/discovery?source=shared"><MessageCircle size={16} /> Open a sample conversation</Link>
          <Link className="button ghost" href="/?setup=1&start=1">Paste your own recommendation <ArrowRight size={15} /></Link>
        </div>
      </aside>
      <section className="feed-stream" aria-label="Buyer feed">
        {entry && <article className="feed-entry">
          <h2>{entry === "assistant" ? "Sample AI recommendation" : "Sample shared conversation"}</h2>
          <p>{entry === "assistant"
            ? "“The Marlow Low Sofa is $749 in pebble twill. Here’s where you can see what buyers said and check it against your space.”"
            : "“I thought of your apartment when I saw the Marlow. Here’s a link to try it in your room.”"}</p>
          <Link className="button primary" href={sofaFindPath("demo-sofa-5", entry)}>Try the Marlow in my room <ArrowRight size={16} /></Link>
        </article>}
        {demoBuyerPosts.map(post => {
          const sofa = demoInventory.sofa.find(product => product.id === post.productId);
          if (!sofa) return null;
          const { count, posts } = demoBuyerEvidence(sofa.id);
          const otherPosts = posts.filter(candidate => candidate.platform !== post.platform);
          const PlatformIcon = post.platform === "instagram" ? Camera : Film;
          return <article id={`post-${post.id}`} key={post.id} className="feed-post" aria-labelledby={`post-title-${post.id}`}>
            <header>
              <div className="buyer-avatar" aria-hidden="true">{post.buyer[0]}</div>
              <div className="buyer-byline"><strong>{post.buyer}</strong><span>{post.context}</span></div>
              <span className="feed-platform"><PlatformIcon size={14} /> Sample {platformLabels[post.platform]} post</span>
            </header>
            <img className="feed-product-image" src={sofa.image} alt={`${sofa.title} in ${sofa.variant}`} />
            <div className="feed-post-body">
              <h2 id={`post-title-${post.id}`}>{post.topic}</h2>
              <blockquote>“{post.quote}”</blockquote>
              <div className="feed-product-details"><div><strong>{sofa.title}</strong><span>{sofa.variant}</span></div><strong>{money(sofa.price)}</strong></div>
              <p className="feed-proof"><CheckCircle2 size={15} /> <strong>{count} verified buyers</strong><span>Sample purchase data</span></p>
              {otherPosts.length > 0 && <div className="feed-other-posts">Also shown on {otherPosts.map(other =>
                <a key={other.id} href={`#post-${other.id}`}>{platformLabels[other.platform]} <ArrowRight size={12} /></a>)}</div>}
              <Link className="button primary feed-action" href={sofaFindPath(sofa.id, "social", post.platform)}>
                Try this sofa in my room <ArrowRight size={16} />
              </Link>
            </div>
          </article>;
        })}
      </section>
    </main>
  </>;
}
