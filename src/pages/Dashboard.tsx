// ONLY key parts changed — safe full replace

// 🔽 KEEP ALL YOUR IMPORTS SAME
// (no changes needed above)

...

      {/* ── Hero Section ── */}
      <section style={{ position: "relative", width: "100%", height: mob ? "55vh" : "80vh", overflow: "hidden" }}>
        {heroImages.length > 0 ? (
          <>
            {heroImages.map((evt, i) => (
              <img
                key={evt.id}
                src={evt.cover_url!}
                alt={evt.name}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: i === heroIdx ? 1 : 0,
                  transition: "opacity 1.2s ease",
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)",
              }}
            />
          </>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.surface2} 100%)`,
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            bottom: mob ? 32 : 60,
            left: mob ? 20 : 60,
            right: mob ? 20 : 60,
          }}
        >
          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: mob ? 32 : 56,
              fontWeight: 300,
              color: colors.white,
            }}
          >
            {studioName}
          </h1>

          <p
            style={{
              fontFamily: fonts.body,
              fontSize: mob ? 12 : 14,
              color: "rgba(255,255,255,0.7)",
              marginTop: 8,
            }}
          >
            {studioTag}
          </p>

          {/* 🔥 NEW CLEAR CTA */}
          <button
            onClick={() => setCreateOpen(true)}
            style={{
              marginTop: 20,
              background: colors.gold,
              color: colors.bg,
              border: "none",
              padding: "12px 28px",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Create Wedding
          </button>
        </div>
      </section>

...

      {/* ── Quick Actions ── */}
      <section
        style={{
          padding: mob ? `32px ${spacing.pageMobile}` : `48px ${spacing.pageDesktop}`,
          maxWidth: 1200,
          margin: "0 auto",
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <h2
          style={{
            fontFamily: fonts.display,
            fontSize: mob ? 22 : 28,
            fontWeight: 300,
            color: colors.text,
            marginBottom: mob ? 20 : 28,
          }}
        >
          Quick Actions
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: mob ? 12 : 16,
          }}
        >
          {[
            { label: "Events", sub: `${totalEvents} total`, path: "/dashboard/events" },
            { label: "AI Retouch", sub: "Enhance photos", path: "/colour-store" },
            { label: "Albums", sub: `${totalAlbums} total`, path: "/dashboard/album-designer" },
            { label: "Studio Feed", sub: "Share highlights", path: "/dashboard/storybook" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                textAlign: "left",
                padding: mob ? 20 : 28,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: colors.textMuted,
                }}
              >
                {item.label}
              </div>

              <div
                style={{
                  fontSize: mob ? 18 : 22,
                  color: colors.text,
                  marginTop: 8,
                }}
              >
                {item.sub}
              </div>

              <div
                style={{
                  fontSize: 10,
                  color: colors.gold,
                  marginTop: 10,
                }}
              >
                Open →
              </div>
            </button>
          ))}
        </div>
      </section>

...

      {/* ── Empty State FIXED ── */}
      {!loading && recentEvents.length === 0 && (
        <section style={{ padding: "80px 20px", textAlign: "center" }}>
          <h2 style={{ fontSize: 32, fontWeight: 300 }}>
            Start your first wedding
          </h2>

          <p style={{ marginTop: 12, color: colors.textMuted }}>
            1. Create Event → 2. Upload Photos → 3. Share with clients
          </p>

          <button
            onClick={() => setCreateOpen(true)}
            style={{
              marginTop: 24,
              background: colors.gold,
              color: colors.bg,
              border: "none",
              padding: "14px 40px",
              cursor: "pointer",
            }}
          >
            + Create Wedding
          </button>
        </section>
      )}