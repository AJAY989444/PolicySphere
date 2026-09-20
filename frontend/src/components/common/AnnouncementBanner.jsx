import { useState, useEffect } from 'react';
import { HiExclamation, HiInformationCircle, HiSparkles, HiX, HiExternalLink } from 'react-icons/hi';
import api from '../../services/api/axios';
import './AnnouncementBanner.css';

function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchActiveBanner = async () => {
      try {
        const res = await api.get('/governance/public/announcements/active');
        if (res.data?.success && res.data.announcement) {
          // Check if previously dismissed in session
          const dismissedId = sessionStorage.getItem('dismissed_banner_id');
          if (dismissedId !== res.data.announcement.id) {
            setAnnouncement(res.data.announcement);
          }
        }
      } catch (err) {
        // Silently ignore if no announcement or network error
      }
    };

    fetchActiveBanner();
  }, []);

  const handleDismiss = () => {
    if (announcement) {
      sessionStorage.setItem('dismissed_banner_id', announcement.id);
    }
    setDismissed(true);
  };

  if (!announcement || dismissed) return null;

  const getSeverityIcon = () => {
    switch (announcement.severity) {
      case 'CRITICAL':
      case 'WARNING':
        return <HiExclamation className="announcement-icon warning" />;
      case 'FESTIVE':
        return <HiSparkles className="announcement-icon festive" />;
      case 'INFO':
      default:
        return <HiInformationCircle className="announcement-icon info" />;
    }
  };

  return (
    <div className={`global-announcement-banner severity-${announcement.severity.toLowerCase()}`}>
      <div className="announcement-content">
        {getSeverityIcon()}
        <div className="announcement-text">
          <strong className="announcement-title">{announcement.title}</strong>
          <span className="announcement-separator">•</span>
          <span className="announcement-message">{announcement.message}</span>
        </div>
        {announcement.linkUrl && (
          <a
            href={announcement.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="announcement-link"
          >
            Learn More <HiExternalLink />
          </a>
        )}
      </div>
      <button
        className="announcement-dismiss-btn"
        onClick={handleDismiss}
        aria-label="Dismiss Announcement"
        title="Dismiss"
      >
        <HiX />
      </button>
    </div>
  );
}

export default AnnouncementBanner;
