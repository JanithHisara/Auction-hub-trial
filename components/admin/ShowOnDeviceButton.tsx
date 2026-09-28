'use client'

import { useState } from 'react'

export default function ShowOnDeviceButton({ auctionId }: { auctionId: string }) {
  const [loading, setLoading] = useState(false)
  
  const handleShow = async () => {
    if (!confirm('Are you sure you want to show this auction on devices immediately?')) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/auctions/${auctionId}/show-device`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to update')
      alert('Success! Devices will now allow entry.')
    } catch (e) {
      alert('Error updating device status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleShow} 
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Sending...' : 'Show on Device'}
    </button>
  )
}
