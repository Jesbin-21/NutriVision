
// pages/DashboardPage.jsx - Main Food Scanner & Nutrient Analytics Dashboard

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import ImageUpload from '../components/ImageUpload';
import NutrientDisplay from '../components/NutrientDisplay';
import Button from '../components/Button';

import {
  Sparkles,
  History,
  Trash2,
  Calendar,
  Activity,
  Award,
} from 'lucide-react';

import './DashboardPage.css';

export default function DashboardPage({ user, token }) {
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [systemNotice, setSystemNotice] = useState('');

  const resultsRef = useRef(null);

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

  // On mobile: auto-scroll to results when analysis completes
  useEffect(() => {
    if (activeAnalysis && resultsRef.current && window.innerWidth <= 768) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 150);
    }
  }, [activeAnalysis]);

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

    if (!confirm('Are you sure you want to delete this scan from history?')) {
      return;
    }

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
        setHistory((prev) =>
          prev.filter((item) => (item._id || item.id) !== id)
        );
      }
    } catch (err) {
      alert('Error deleting history item.');
    }
  };

  return (
    <div className="container db-wrapper">

      {/* Overview Stats */}
      <div className="db-stats-grid">

        {/* Vision Engine */}
        <div className="glass-card db-stat-card">
          <div className="db-stat-icon db-stat-icon-ai">
            <Sparkles size={24} />
          </div>

          <div>
            <div className="db-stat-label">
              Vision Engine
            </div>

            <div className="db-stat-value db-stat-value-ai">
              Gemini Vision 3.6 Flash
            </div>
          </div>
        </div>

        {/* Saved Scans */}
        <div className="glass-card db-stat-card">
          <div className="db-stat-icon db-stat-icon-history">
            <History size={24} />
          </div>

          <div>
            <div className="db-stat-label">
              Saved Scans
            </div>

            <div className="db-stat-value">
              {history.length} Meals Logged
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="glass-card db-stat-card">
          <div className="db-stat-icon db-stat-icon-user">
            <Award size={24} />
          </div>

          <div>
            <div className="db-stat-label">
              Authentication
            </div>

            <div className="db-stat-value">
              {user ? user.name : 'Guest User'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Scanner Section */}
      <div className={`db-scanner-grid${activeAnalysis ? '' : ' single-col'}`}>

        <div>
          <ImageUpload
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {activeAnalysis && (
          <div ref={resultsRef}>
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

          <div className="db-history-title">
            <div className="db-history-icon">
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

        {/* Empty History */}
        {history.length === 0 ? (
          <div className="db-empty-history">

            <Activity
              size={36}
              className="db-empty-icon"
            />

            <p className="db-empty-title">
              No meal scans recorded yet
            </p>

            <p className="db-empty-text">
              Upload your first food image above to see its nutrient
              breakdown saved here.
            </p>
          </div>
        ) : (

          /* History Items */
          <div className="db-history-grid">

            {history.map((item) => {
              const itemId = item._id || item.id;

              return (
                <div
                  key={itemId}
                  className="db-history-item"
                  onClick={() => setActiveAnalysis(item)}
                >

                  {/* History Header */}
                  <div className="db-history-item-header">

                    <div>
                      <h4 className="db-history-food-name">
                        {item.foodName}
                      </h4>

                      <span className="db-history-date">
                        <Calendar size={12} />

                        {new Date(
                          item.createdAt || Date.now()
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      onClick={(e) =>
                        handleDeleteHistory(itemId, e)
                      }
                      title="Delete scan"
                      className="db-delete-button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Calories + Health Score */}
                  <div className="db-history-badges">

                    <span className="db-calorie-badge">
                      {item.calories} kcal
                    </span>

                    <span className="db-score-badge">
                      Score: {item.healthScore || 85}/100
                    </span>
                  </div>

                  {/* Macros + Ingredients */}
                  <div className="db-history-meta">

                    <div>
                      <span>
                        P: {item.macros?.protein || 0}g
                      </span>

                      {' • '}

                      <span>
                        C: {item.macros?.carbs || 0}g
                      </span>

                      {' • '}

                      <span>
                        F: {item.macros?.fats || 0}g
                      </span>
                    </div>

                    {item.ingredients &&
                      item.ingredients.length > 0 && (
                        <span className="db-ingredients-count">
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
  );
}
