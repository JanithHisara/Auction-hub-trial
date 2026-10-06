with open("components/admin/AdminControls.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Replace the TENDER BASE / FIXED BID CONTROLS section
import re

old_tender_block = r"\{/\* TENDER BASE / FIXED BID CONTROLS \*/\}(.*?)\{/\* PROGRESSIVE ELIMINATION CONTROLS \*/\}"

new_tender_block = """{/* TENDER BASE / FIXED BID CONTROLS */}
          {isTenderBaseFixedBid && (
            <>
              {/* For sealed bid, admin just needs to announce winner after auction ends */}
              <button
                onClick={() => setShowAnnounceWinnerModal(true)}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                Announce Winner
              </button>
            </>
          )}

          {/* PROGRESSIVE ELIMINATION CONTROLS */}"""

c = re.sub(old_tender_block, new_tender_block, c, flags=re.DOTALL)

with open("components/admin/AdminControls.tsx", "w", encoding="utf-8") as f:
    f.write(c)
