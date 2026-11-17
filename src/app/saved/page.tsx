"use client";

import Link from "next/link";
import { ArrowRight, Bookmark } from "lucide-react";
import { BookmarkFurniture } from "@/components/bookmark-furniture";
import { SocialSourceIcon } from "@/components/social-source-icon";
import { RoomReadyBrand } from "@/components/roomready-brand";
import { money } from "@/lib/budget";
import { demoProducts } from "@/lib/demo";
import { platformLabels, furnitureFindPath } from "@/lib/discovery-links";
import { useSavedFurniture } from "@/lib/saved-furniture";

export default function SavedPage() {
  const saved = useSavedFurniture(state => state.saved);
  const products = demoProducts.flatMap(product => {
    const platform = saved[product.id];
    return platform ? [{ product, platform }] : [];
  });

  return <>
    <header className="site-header saved-site-header"><div className="site-inner">
      <RoomReadyBrand />
    </div></header>
    <main className="site-inner saved-page">
      <h1>Saved furniture</h1>
      {!products.length ? <div className="saved-empty">
        <Bookmark size={24} aria-hidden="true" />
        <h2>Keep your favorite finds here</h2>
        <p>Bookmark a piece from the Home feed to try it in your room later.</p>
        <Link className="button primary" href="/">Browse the feed <ArrowRight size={16} /></Link>
      </div> : <div className="saved-grid">
        {products.map(({ product, platform }) => <article key={product.id} className="saved-product">
            <img src={product.image} alt="" />
            <div className="saved-product-body">
              <div className="saved-product-heading">
                <div><h2>{product.title}</h2><p>{money(product.price)} · {product.variant}</p></div>
                <BookmarkFurniture productId={product.id} name={product.title} platform={platform} />
              </div>
              <p className="saved-source social-attribution"><SocialSourceIcon platform={platform} size={14} /> Saved from a sample {platformLabels[platform]} post</p>
              <Link className="button outline" href={furnitureFindPath(product.id, "social", platform)}>Try it in my room <ArrowRight size={16} /></Link>
            </div>
          </article>)}
      </div>}
    </main>
  </>;
}
