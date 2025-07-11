import React, { useState } from 'react';
import './Footer.css';
import About from './About';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import Contact from './Contact';

const footerLinks = [
  {
    label: 'About',
    className: 'footer-about',
    component: About,
  },
  {
    label: 'Privacy Policy',
    className: 'footer-privacy',
    component: PrivacyPolicy,
  },
  {
    label: 'Terms of Service',
    className: 'footer-terms',
    component: TermsOfService,
  },
  {
    label: 'Contact',
    className: 'footer-contact',
    component: Contact,
  },
];

const Footer = () => {
  const [openModal, setOpenModal] = useState(null);

  const handleOpen = (label) => setOpenModal(label);
  const handleClose = () => setOpenModal(null);

  const ActiveComponent = openModal
    ? footerLinks.find((l) => l.label === openModal)?.component
    : null;

  return (
    <footer className="footer">
      <div className="footer-content">
        {openModal && (
          <div className="footer-modal-overlay" onClick={handleClose}>
            <div className="footer-modal" onClick={(e) => e.stopPropagation()}>
              <button className="footer-modal-close" onClick={handleClose}>
                &times;
              </button>
              {ActiveComponent && <ActiveComponent />}
            </div>
          </div>
        )}
        <div className="footer-links">
          {footerLinks.map((link) => (
            <button
              key={link.label}
              className={`footer-label ${link.className} footer-btn`}
              onClick={() => handleOpen(link.label)}
              type="button"
            >
              {link.label}
            </button>
          ))}
        </div>
        <div className="copyright">
          &copy; {new Date().getFullYear()} Placement Portal - All Rights Reserved
        </div>
      </div>
    </footer>
  );
};

export default Footer;
