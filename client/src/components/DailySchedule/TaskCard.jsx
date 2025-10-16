import React from 'react';

/**
 * TaskCard Component
 * 
 * Renders a single task with absolute positioning based on computed layout.
 * Features:
 * - Text truncation with ellipsis for long titles
 * - Focusable and accessible
 * - Hold-to-complete interaction
 * - Responsive to narrow lanes
 */
const TaskCard = ({
  task,
  layout,
  isLate,
  isHolding,
  holdProgress,
  nowMinutes,
  onTickActivity,
  onHoldStart,
  onHoldEnd,
  onHoldCancel
}) => {
  const { id, title, start, end, done } = task;
  const { topPx, heightPx, leftPx, widthPx } = layout;

  // Format time for display
  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const timeRange = `${formatTime(start)} - ${formatTime(end)}`;
  const ariaLabel = `${title}, ${timeRange}${done ? ', completed' : isLate ? ', late' : ''}`;

  // Determine background color
  let bgColor = '#fbbf24'; // Default yellow
  if (done) bgColor = '#e0f2fe'; // Light blue for done
  else if (isLate) bgColor = '#fecaca'; // Light red for late

  // Determine text color (black for errors per requirement 2)
  let textColor = '#222';
  if (done) textColor = '#888';
  else if (isLate) textColor = '#000'; // Black for late tasks

  return (
    <div
      style={{
        position: 'absolute',
        left: leftPx,
        top: topPx,
        height: heightPx,
        width: widthPx,
        background: bgColor,
        color: textColor,
        borderRadius: 7,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        fontWeight: 500,
        fontSize: 13,
        zIndex: 2,
        border: isLate ? '2px solid #ef4444' : undefined,
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
      title={ariaLabel}
      tabIndex={0}
      role="article"
      aria-label={ariaLabel}
    >
      {/* Completion Button */}
      <button
        type="button"
        aria-label={done ? "Completed" : "Hold to mark as done"}
        onMouseDown={() => !done && onHoldStart(id)}
        onMouseUp={onHoldEnd}
        onMouseLeave={onHoldCancel}
        onTouchStart={() => !done && onHoldStart(id)}
        onTouchEnd={onHoldEnd}
        style={{
          width: 36,
          height: 36,
          minWidth: 36,
          minHeight: 36,
          borderRadius: '50%',
          border: done ? '2.5px solid #22c55e' : '2.5px solid #cbd5e1',
          background: done ? '#22c55e' : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: done ? 'default' : 'pointer',
          marginRight: 10,
          position: 'relative',
          outline: 'none',
          transition: 'background 0.2s, border 0.2s',
          padding: 0,
          overflow: 'visible',
          flexShrink: 0
        }}
        disabled={done}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke={done ? '#fff' : '#22c55e'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: done ? 1 : 0.8, display: 'block' }}
        >
          <polyline points="5 11 9 15 15 7" />
        </svg>
        {isHolding && !done && (
          <svg width="40" height="40" style={{ position: 'absolute', top: -4, left: -4, pointerEvents: 'none', zIndex: 1 }}>
            <circle
              cx="20"
              cy="20"
              r="17"
              stroke="#22c55e"
              strokeWidth="3.5"
              fill="none"
              strokeDasharray={2 * Math.PI * 17}
              strokeDashoffset={2 * Math.PI * 17 * (1 - holdProgress / 100)}
              style={{
                transition: 'stroke-dashoffset 0.1s linear',
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%'
              }}
            />
          </svg>
        )}
      </button>

      {/* Task Content - with text truncation */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minWidth: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: heightPx > 60 ? 4 : 0
        }}>
          <span style={{
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0
          }}>
            {title}
          </span>
          {isLate && (
            <span style={{
              color: '#000', // Black text for readability (requirement 2)
              background: '#fee2e2',
              borderRadius: 5,
              fontWeight: 800,
              fontSize: 11,
              marginLeft: 8,
              padding: '2px 7px',
              letterSpacing: 0.5,
              flexShrink: 0
            }}>
              Late
            </span>
          )}
        </div>
        {heightPx > 60 && (
          <span style={{
            fontSize: 11,
            opacity: 0.8,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {timeRange}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
