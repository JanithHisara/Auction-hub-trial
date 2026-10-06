import re

with open("components/admin/TenderStatusActions.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Replace statusFlow
new_status_flow = """const statusFlow: Record<string, { next: string | null, label: string, icon: React.ReactNode, color: string, description: string }> = {
  draft: { 
    next: 'upcoming', 
    label: 'Mark Ready', 
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'bg-blue-500 hover:bg-blue-600',
    description: 'Mark auction as ready and upcoming.'
  },
  upcoming: { 
    next: 'registration_open', 
    label: 'Open Registration', 
    icon: <Users className="w-4 h-4" />,
    color: 'bg-emerald-500 hover:bg-emerald-600',
    description: 'Allow users to register for this auction. Make sure all items are added.'
  },
  registration_open: { 
    next: 'live', 
    label: 'Start Bidding', 
    icon: <Radio className="w-4 h-4" />,
    color: 'bg-red-500 hover:bg-red-600',
    description: 'Start the sealed bid auction. Bidders can now place their bids.'
  },
  registration_closed: { 
    next: 'live', 
    label: 'Start Bidding', 
    icon: <Radio className="w-4 h-4" />,
    color: 'bg-red-500 hover:bg-red-600',
    description: 'Start the sealed bid auction.'
  },
  live: { 
    next: 'ended', 
    label: 'End Bidding', 
    icon: <StopCircle className="w-4 h-4" />,
    color: 'bg-amber-500 hover:bg-amber-600',
    description: 'Stop accepting bids. You will then be able to reveal the winners.'
  },
  ended: { 
    next: 'completed', 
    label: 'Mark Complete', 
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'bg-purple-500 hover:bg-purple-600',
    description: 'Finalize the auction after all winners are revealed.'
  },
  completed: { 
    next: null, 
    label: 'Auction Completed', 
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'bg-gray-500',
    description: 'This auction has been completed.'
  },
}"""

old_status_flow_pattern = r"const statusFlow: Record<string, \{.*?\}> = \{.*?completed: \{.*?\},?\n\}"
c = re.sub(old_status_flow_pattern, new_status_flow, c, flags=re.DOTALL)

with open("components/admin/TenderStatusActions.tsx", "w", encoding="utf-8") as f:
    f.write(c)

