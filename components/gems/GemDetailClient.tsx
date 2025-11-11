'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import CountdownTimer from '@/components/auctions/CountdownTimer'
import BidForm from '@/components/auctions/BidForm'
import BidHistory from '@/components/auctions/BidHistory'
import RealtimeBidUpdates from '@/components/auctions/RealtimeBidUpdates'
import RealtimeGemStatus from '@/components/auctions/RealtimeGemStatus'
import WinnerPaymentLink from '@/components/payment/WinnerPaymentLink'
import type { Gem, Bid, GemImage, GemCertificate } from '@/types/database'

interface GemDetailClientProps {
  initialGem: Gem & {
    images: GemImage[]
    certificates: GemCertificate[]
    bids: Bid[]
    winner?: any
    isActive: boolean
  }
}

export default function GemDetailClient({ initialGem }: GemDetailClientProps) {
  const [gem, setGem] = useState(initialGem)
  const [bids, setBids] = useState(initialGem.bids)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const handleBidUpdate = (newBids: Bid[]) => {
    setBids(newBids)
    // Update current bid display
    const highestBid = newBids[0]?.bid_amount || gem.starting_price
    // Trigger a visual update
    setGem({ ...gem, bids: newBids })
  }

  const highestBid = bids?.[0]?.bid_amount || gem.starting_price
  const bidIncrease = ((highestBid - gem.starting_price) / gem.starting_price) * 100
  const mainImage = gem.images?.[selectedImageIndex]?.image_url || gem.images?.[0]?.image_url

  return (
    <>
      <RealtimeBidUpdates gemId={gem.id} onBidUpdate={handleBidUpdate} />
      {gem.isActive && <RealtimeGemStatus gemId={gem.id} />}
      
      {/* Enhanced Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4">
          <a href="/" className="hover:text-[var(--gold-dark)] transition-colors">Home</a>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-medium">{gem.name}</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-2">
          {gem.name}
        </h1>
        {gem.isActive && (
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[var(--gold-light)]/20 border border-[var(--gold-light)] rounded-full">
            <div className="relative">
              <div className="w-2 h-2 bg-[var(--gold-accent)] rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 bg-[var(--gold-accent)] rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">Live Auction</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
        {/* Enhanced Image Gallery - Left Column */}
        <div className="lg:col-span-2">
          {gem.images && gem.images.length > 0 ? (
            <div className="bg-white border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-sm">
              {/* Main Image */}
              <div className="relative aspect-square mb-4 rounded-xl overflow-hidden bg-[var(--background)] group">
                <img
                  src={mainImage}
                  alt={gem.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {gem.isActive && (
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[var(--gold-light)] shadow-xl">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="w-3 h-3 text-[var(--gold-dark)]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Ends In</span>
                    </div>
                    <CountdownTimer endTime={gem.end_time} />
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              {gem.images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {gem.images.map((img, index) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-[var(--gold)] shadow-md scale-105'
                          : 'border-[var(--border)] hover:border-[var(--gold-light)]'
                      }`}
                    >
                      <img
                        src={img.image_url}
                        alt={`${gem.name} - Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-[var(--border)] rounded-2xl p-12 sm:p-16 shadow-sm">
              <div className="flex items-center justify-center aspect-square bg-gradient-to-br from-[var(--gold-light)]/20 to-[var(--gold)]/10 rounded-xl">
                <svg className="w-24 h-24 text-[var(--gold-dark)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Auction Info & Bid Section - Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Auction Status Card */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-6">Auction Details</h2>
            
            {/* Current Bid - Prominent */}
            <div className="mb-6 p-5 bg-gradient-to-br from-[var(--gold-light)]/20 to-[var(--gold-light)]/10 rounded-xl border border-[var(--gold-light)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider flex items-center gap-2">
                <span>Current Bid</span>
                {bidIncrease > 0 && (
                  <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs font-bold rounded-full">
                    +{bidIncrease.toFixed(0)}%
                  </span>
                )}
              </p>
              <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] bg-clip-text text-transparent mb-2">
                {formatCurrency(highestBid)}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {bids?.length || 0} {bids?.length === 1 ? 'bid' : 'bids'} placed
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-[var(--border)]">
              <div className="p-3 bg-[var(--background)] rounded-lg">
                <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Starting Price</p>
                <p className="text-lg font-bold text-[var(--gold-dark)]">{formatCurrency(gem.starting_price)}</p>
              </div>
              <div className="p-3 bg-[var(--background)] rounded-lg">
                <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Min Increment</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">{formatCurrency(gem.min_bid_increment)}</p>
              </div>
            </div>

            {/* Bid Form or Winner Info */}
            {gem.isActive ? (
              <BidForm gem={gem} currentBid={highestBid} />
            ) : gem.winner ? (
              <div className="p-5 bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wider">Auction Ended</p>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">Winner</p>
                <p className="text-lg font-bold text-green-600 mb-4">
                  {(gem.winner.user as any)?.email || 'Unknown'}
                </p>
                <WinnerPaymentLink gemId={gem.id} />
              </div>
            ) : (
              <div className="p-5 bg-[var(--background)] border border-[var(--border)] rounded-xl">
                <p className="text-sm font-medium text-[var(--text-secondary)]">Auction has ended</p>
              </div>
            )}
          </div>

          {/* Specifications Card */}
          {(gem.carat_weight || gem.cut || gem.color || gem.clarity) && (
            <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--gold-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Specifications
              </h2>
              <div className="space-y-3">
                {gem.carat_weight && (
                  <div className="flex justify-between items-center p-3 bg-[var(--background)] rounded-lg">
                    <span className="text-sm text-[var(--text-muted)]">Carat Weight</span>
                    <span className="text-base font-semibold text-[var(--text-primary)]">{gem.carat_weight} ct</span>
                  </div>
                )}
                {gem.cut && (
                  <div className="flex justify-between items-center p-3 bg-[var(--background)] rounded-lg">
                    <span className="text-sm text-[var(--text-muted)]">Cut</span>
                    <span className="text-base font-semibold text-[var(--text-primary)]">{gem.cut}</span>
                  </div>
                )}
                {gem.color && (
                  <div className="flex justify-between items-center p-3 bg-[var(--background)] rounded-lg">
                    <span className="text-sm text-[var(--text-muted)]">Color</span>
                    <span className="text-base font-semibold text-[var(--text-primary)]">{gem.color}</span>
                  </div>
                )}
                {gem.clarity && (
                  <div className="flex justify-between items-center p-3 bg-[var(--background)] rounded-lg">
                    <span className="text-sm text-[var(--text-muted)]">Clarity</span>
                    <span className="text-base font-semibold text-[var(--text-primary)]">{gem.clarity}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description & Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Description</h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed whitespace-pre-line">
              {gem.description}
            </p>
          </div>

          {gem.provenance && (
            <div className="bg-white border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm mt-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-[var(--gold-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Provenance
              </h2>
              <p className="text-[var(--text-secondary)] text-base leading-relaxed whitespace-pre-line">
                {gem.provenance}
              </p>
            </div>
          )}

          {gem.certificates && gem.certificates.length > 0 && (
            <div className="bg-white border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm mt-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-[var(--gold-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Certificates
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gem.certificates.map((cert) => (
                  <a
                    key={cert.id}
                    href={cert.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:border-[var(--gold-light)] hover:bg-[var(--gold-light)]/5 transition-all group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-[var(--gold-light)]/20 rounded-lg flex items-center justify-center group-hover:bg-[var(--gold-light)]/30 transition-colors">
                      <svg className="w-5 h-5 text-[var(--gold-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--gold-dark)] transition-colors">
                        {cert.certificate_type || 'Certificate'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">View certificate</p>
                    </div>
                    <svg className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--gold-dark)] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bid History */}
      <BidHistory bids={bids || []} />
    </>
  )
}

