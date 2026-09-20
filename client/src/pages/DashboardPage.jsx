// pages/DashboardPage.jsx - Main Food Scanner & Nutrient Analytics Dashboard
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ImageUpload from '../components/ImageUpload';
import NutrientDisplay from '../components/NutrientDisplay';
import Button from '../components/Button';
import {
  Sparkles,
  History,
  Trash2,
  Calendar,
  Eye,
  Activity,
  Award,
  Zap,
} from 'lucide-react';

export default function DashboardPage({ user, token }) {
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [systemNotice, setSystemNotice] = useState('');

  // Fetch scan history on load or after new scan
  const fetchHistory = async () => {
    if (!token) return;
    try {
      setIsLoadingHistory(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/food/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = res.data;
      if (data.success && data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.warn('Failed to load history:', err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  // Handle image analysis trigger from ImageUpload
const handleAnalyze = async ({ file, presetName, imageUrl }) => {
  setIsAnalyzing(true);
  setSystemNotice('');

  try {
    let response;

    if (file) {
      const formData = new FormData();
      formData.append('image', file);

      response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/food/analyze`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } else {
      response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/food/analyze`,
        {
          imageBase64: imageUrl,
          foodHint: presetName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }

    const result = response.data;

    if (!result.success) {
      throw new Error(result.message || 'Failed to analyze food.');
    }

    setActiveAnalysis({
      ...result.data,
      usedAi: result.usedAi,
      aiNotice: result.aiNotice,
    });

    fetchHistory();
  } catch (err) {
    alert(`Analysis error: ${err.response?.data?.message || err.message}`);
  } finally {
    setIsAnalyzing(false);
  }
};

  // Delete an item from history
  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this scan from history?')) return;
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/food/history/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = res.data;
      if (data.success) {
        setHistory((prev) => prev.filter((item) => (item._id || item.id) !== id));
      }
    } catch (err) {
      alert('Error deleting history item.');
    }
  };

  return (
    <>
      {/* Responsive styles */}
      <style>{`
        .db-wrapper {
          padding: 2rem 1.5rem 4rem;
        }

        /* ── Stats row ── */
        .db-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .db-stat-card {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        /* ── Scanner section ── */
        .db-scanner-grid {
          display: grid;
          gap: 2rem;
          align-items: start;
          margin-bottom: 3rem;
          grid-template-columns: 1fr 1.3fr;
        }

        .db-scanner-grid.single-col {
          grid-template-columns: 1fr;
        }

        /* ── History section ── */
        .db-history-card {
          padding: 2rem;
        }

        .db-history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        .db-history-header h3 {
          font-size: 1.35rem;
          margin: 0;
          color: #ffffff;
        }

        .db-history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        /* ── Mobile (≤ 640px) ── */
        @media (max-width: 640px) {
          .db-wrapper {
            padding: 1rem 0.75rem 3rem;
          }

          /* Stats: single column on very small screens */
          .db-stats-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
            margin-bottom: 1.25rem;
          }

          .db-stat-card {
            padding: 1rem 1.1rem;
            gap: 1rem;
          }

          /* Scanner: always single column on mobile */
          .db-scanner-grid,
          .db-scanner-grid.single-col {
            grid-template-columns: 1fr !important;
            gap: 1.25rem;
            margin-bottom: 1.75rem;
          }

          /* History card */
          .db-history-card {
            padding: 1.1rem 0.9rem;
          }

          .db-history-header {
            flex-direction: column;
            align-items: flex-start;
            margin-bottom: 1rem;
          }

          .db-history-header h3 {
            font-size: 1.1rem;
          }

          /* History grid: single column on mobile */
          .db-history-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
        }

        /* ── Small tablets (641px – 900px) ── */
        @media (min-width: 641px) and (max-width: 900px) {
          /* Scanner: stack vertically when analysis is active */
          .db-scanner-grid {
            grid-template-columns: 1fr;
          }

          .db-stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          }

          .db-history-grid {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          }
        }
      `}</style>

      <div className="container db-wrapper">
        {/* Welcome Banner / Overview Stats */}
        <div className="db-stats-grid">
          <div className="glass-card db-stat-card">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Vision Engine
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>
                Gemini Vision 3.6 Flash
              </div>
            </div>
          </div>

          <div className="glass-card db-stat-card">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <History size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Saved Scans
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                {history.length} Meals Logged
              </div>
            </div>
          </div>

          <div className="glass-card db-stat-card">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(244, 63, 94, 0.15)',
                color: '#fb7185',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Award size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Authentication
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                {user ? user.name : 'Guest User'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Scanner Section */}
        <div className={`db-scanner-grid${activeAnalysis ? '' : ' single-col'}`}>
          <div>
            <ImageUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
          </div>

          {activeAnalysis && (
            <div>
              <NutrientDisplay
                data={activeAnalysis}
                aiNotice={activeAnalysis.aiNotice}
                usedAi={activeAnalysis.usedAi}
              />
            </div>
          )}
        </div>

        {/* History Log Section */}
        <div className="glass-card db-history-card">
          <div className="db-history-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <History size={20} />
              </div>
              <h3>Your Meal Scan History</h3>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchHistory}
              isLoading={isLoadingHistory}
            >
              Refresh History
            </Button>
          </div>

          {history.length === 0 ? (
            <div
              style={{
                padding: '3rem 1.5rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: '14px',
              }}
            >
              <Activity size={36} color="var(--text-subtle)" style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.25rem' }}>
                No meal scans recorded yet
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
                Upload your first food image above to see its nutrient breakdown saved here.
              </p>
            </div>
          ) : (
            <div className="db-history-grid">
              {history.map((item) => {
                const itemId = item._id || item.id;
                return (
                  <div
                    key={itemId}
                    onClick={() => setActiveAnalysis(item)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', margin: 0, color: '#ffffff' }}>
                          {item.foodName}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                          <Calendar size={12} />
                          {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteHistory(itemId, e)}
                        title="Delete scan"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-subtle)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px',
                          transition: 'color 0.2s',
                          minWidth: '32px',
                          minHeight: '32px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#fb7185')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-subtle)')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          background: 'rgba(249, 115, 22, 0.15)',
                          color: '#fed7aa',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                        }}
                      >
                        {item.calories} kcal
                      </span>
                      <span
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                        }}
                      >
                        Score: {item.healthScore || 85}/100
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.25rem' }}>
                      <div>
                        <span>P: {item.macros?.protein || 0}g</span> •{' '}
                        <span>C: {item.macros?.carbs || 0}g</span> •{' '}
                        <span>F: {item.macros?.fats || 0}g</span>
                      </div>
                      {item.ingredients && item.ingredients.length > 0 && (
                        <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                          {item.ingredients.length} ingredients
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
