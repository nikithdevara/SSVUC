import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { useToast } from './Toast';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
  label?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url,
  className = '',
  variant = 'outline',
  size = 'sm',
  label = 'Share',
}) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = url || window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
        showToast('Shared successfully!', 'success');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User cancelled
      }
    }

    // Fallback: clipboard copy
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2200);
    } catch {
      showToast('Unable to copy link', 'error');
    }
  };

  const baseStyle =
    'inline-flex items-center gap-1.5 font-bold transition-all rounded-xl cursor-pointer select-none';
  const sizeStyle = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  const variantStyle =
    variant === 'primary'
      ? 'bg-[#D97706] text-white hover:bg-[#B45309] shadow-xs'
      : variant === 'secondary'
      ? 'bg-[#7F1D1D] text-white hover:bg-[#991B1B] shadow-xs'
      : variant === 'outline'
      ? 'bg-white border border-[#C9972B]/40 text-[#78350F] hover:bg-[#FEF3C7] shadow-2xs'
      : 'text-[#78350F] hover:bg-[#D97706]/10';

  return (
    <button
      onClick={handleShare}
      className={`${baseStyle} ${sizeStyle} ${variantStyle} ${className}`}
      title="Share or copy link"
      aria-label="Share"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
