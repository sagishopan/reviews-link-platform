import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as api from '../api.js';
import { applyBrandColors } from '../utils/color.js';
import { hasRecentlyRated, markRated } from '../utils/dedup.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import AccessibilityMenu from '../components/AccessibilityMenu.jsx';
import BranchPickerScreen from './screens/BranchPickerScreen.jsx';
import BranchSelectorScreen from './screens/BranchSelectorScreen.jsx';
import RatingScreen from './screens/RatingScreen.jsx';
import CategoriesScreen from './screens/CategoriesScreen.jsx';
import DetailsScreen from './screens/DetailsScreen.jsx';
import ContactScreen from './screens/ContactScreen.jsx';
import ThankYouScreen from './screens/ThankYouScreen.jsx';
import NotFoundScreen from './screens/NotFoundScreen.jsx';

const REDIRECT_DELAY_MS = 1500;

export default function RatingFlow() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('t');
  const { t } = useI18n();

  const [phase, setPhase] = useState('loading');
  const [restaurant, setRestaurant] = useState(null);
  const [branches, setBranches] = useState([]);
  const [branch, setBranch] = useState(null);
  const [branchSelectionMethod, setBranchSelectionMethod] = useState(null);

  const [ratingValue, setRatingValue] = useState(0);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const [responseId, setResponseId] = useState(null);
  const [feedbackToken, setFeedbackToken] = useState(null);
  const [categories, setCategories] = useState([]);
  const [comment, setComment] = useState('');
  const [contact, setContact] = useState({ name: '', phone: '', consent: false });
  const [hasContact, setHasContact] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      // If no slug (universal /r route), load the default restaurant and show selector
      if (!slug) {
        try {
          const { restaurant: r, branches: b } = await api.getRestaurant('demo-chain');
          if (cancelled) return;
          applyBrandColors(r);
          setRestaurant(r);
          setBranches(b);

          // Check if there's a cached selection (max 3 hours)
          const cached = localStorage.getItem('selectedBranch');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Date.now() - parsed.timestamp < 3 * 60 * 60 * 1000) {
                const selectedBranch = b.find(br => br.id === parsed.id);
                if (selectedBranch) {
                  setBranch(selectedBranch);
                  setBranchSelectionMethod(parsed.method);
                  setAlreadyRated(hasRecentlyRated(selectedBranch.id));
                  setPhase('rating');
                  return;
                }
              }
            } catch {}
            localStorage.removeItem('selectedBranch');
          }

          setPhase('selector');
          return;
        } catch (err) {
          if (!cancelled) setPhase('error');
          return;
        }
      }

      // Existing logic for /r/:slug routes
      try {
        const { restaurant: r, branches: b } = await api.getRestaurant(slug);
        if (cancelled) return;
        applyBrandColors(r);
        setRestaurant(r);
        setBranches(b);
        setPhase('picker');
        return;
      } catch (err) {
        if (err.status !== 404) {
          if (!cancelled) setPhase('error');
          return;
        }
      }

      try {
        const { branch: br } = await api.getBranch(slug);
        if (cancelled) return;
        const { restaurant: r, branches: b } = await api.getRestaurant(br.restaurant_slug);
        if (cancelled) return;
        applyBrandColors(r);
        setRestaurant(r);
        setBranch(br);
        setBranchSelectionMethod('direct_link');
        setAlreadyRated(hasRecentlyRated(br.id));
        setPhase('rating');
      } catch (err) {
        if (!cancelled) setPhase(err.status === 404 ? 'not-found' : 'error');
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const selectBranch = useCallback(async (branchSummary) => {
    setPhase('loading');
    try {
      const { branch: full } = await api.getBranch(branchSummary.slug);
      applyBrandColors(full);
      setBranch(full);
      setAlreadyRated(hasRecentlyRated(full.id));
      setPhase('rating');
    } catch {
      setPhase('error');
    }
  }, []);

  const selectBranchFromSelector = useCallback((branchData, method) => {
    setBranch({
      id: branchData.id,
      slug: branchData.slug,
      name: branchData.name,
      restaurant_name: restaurant?.name,
      restaurant_slug: restaurant?.slug,
      logo_url: restaurant?.logo_url,
      primary_color: restaurant?.primary_color,
      accent_color: restaurant?.accent_color,
      privacy_policy_url: restaurant?.privacy_policy_url,
    });
    setBranchSelectionMethod(method);
    setAlreadyRated(hasRecentlyRated(branchData.id));
    setPhase('rating');
  }, [restaurant]);

  const selectRating = useCallback(
    async (value) => {
      if (alreadyRated || !branch) return;
      setRatingValue(value);
      try {
        const result = await api.submitRating(branch.slug, value, source, branchSelectionMethod);
        markRated(branch.slug);
        setResponseId(result.response_id);
        setFeedbackToken(result.feedback_token);

        if (result.needs_feedback) {
          setTimeout(() => setPhase('feedback-categories'), 400);
        } else if (result.redirect_url) {
          setRedirecting(true);
          setTimeout(() => {
            window.location.href = result.redirect_url;
          }, REDIRECT_DELAY_MS);
        } else {
          setPhase('feedback-thanks');
        }
      } catch (err) {
        console.error('[RatingFlow] ERROR:', err);
        setPhase('error');
      }
    },
    [alreadyRated, branch, source, branchSelectionMethod]
  );

  const toggleCategory = (key) => {
    setCategories((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  };

  const finishFeedback = useCallback(
    async (finalContact) => {
      const consentGiven = !!finalContact?.consent;
      const hasPhone = !!finalContact?.phone;
      setHasContact(consentGiven && hasPhone);
      try {
        await api.submitFeedback(responseId, {
          feedback_token: feedbackToken,
          categories,
          comment,
          customer_name: finalContact?.name || undefined,
          customer_phone: finalContact?.phone || undefined,
          contact_consent: consentGiven,
        });
      } catch {
        // Feedback attach is best-effort from the customer's point of view -
        // the rating itself was already saved. Still show the thank-you screen.
      }
      setPhase('feedback-thanks');
    },
    [responseId, feedbackToken, categories, comment]
  );

  let content = null;

  if (phase === 'loading') {
    content = (
      <div className="min-h-screen flex items-center justify-center text-body" key="loading">
        {t.common.loading}
      </div>
    );
  } else if (phase === 'not-found' || phase === 'error') {
    content = <NotFoundScreen key="notfound" />;
  } else if (phase === 'selector') {
    content = <BranchSelectorScreen key="selector" branches={branches} onSelect={selectBranchFromSelector} />;
  } else if (phase === 'picker') {
    content = <BranchPickerScreen key="picker" restaurant={restaurant} branches={branches} onSelect={selectBranch} />;
  } else if (phase === 'rating') {
    content = (
      <RatingScreen
        key="rating"
        branch={branch}
        rating={ratingValue}
        onSelect={selectRating}
        redirecting={redirecting}
        alreadyRated={alreadyRated}
      />
    );
  } else if (phase === 'feedback-categories') {
    content = (
      <CategoriesScreen
        key="categories"
        selected={categories}
        onToggle={toggleCategory}
        onContinue={() => setPhase('feedback-details')}
        onSkipAll={() => finishFeedback(contact)}
      />
    );
  } else if (phase === 'feedback-details') {
    content = <DetailsScreen key="details" comment={comment} onChange={setComment} onContinue={() => setPhase('feedback-contact')} />;
  } else if (phase === 'feedback-contact') {
    content = <ContactScreen key="contact" contact={contact} onChange={setContact} onFinish={() => finishFeedback(contact)} />;
  } else if (phase === 'feedback-thanks') {
    content = <ThankYouScreen key="thanks" hasContact={hasContact} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {content}
      {phase !== 'loading' && <AccessibilityMenu />}
    </div>
  );
}
