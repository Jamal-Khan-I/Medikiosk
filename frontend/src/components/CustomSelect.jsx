import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = forwardRef(function CustomSelect(
  {
    value,
    onChange,
    options = [],
    placeholder = 'Select option...',
    onKeyDown,
    className = '',
    style = {},
    disabled = false,
    id,
    name
  },
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerButtonRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      triggerButtonRef.current?.focus();
    }
  }));

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const handleSelect = (val) => {
    setIsOpen(false);
    triggerButtonRef.current?.focus();
    onChange?.(val);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = options.findIndex((opt) => String(opt.value) === String(value));
        let nextIndex = 0;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        }
        onChange?.(options[nextIndex]?.value);
      }
    } else if (e.key === 'Enter') {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
      } else {
        // Forward Enter key to parent form navigation (e.g. mobileInputRef focus)
        onKeyDown?.(e);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else {
      onKeyDown?.(e);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      <button
        ref={triggerButtonRef}
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`custom-select-trigger ${isOpen ? 'active-open' : ''} ${!value ? 'is-placeholder' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="custom-select-label">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`custom-select-chevron ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="custom-select-dropdown" role="listbox">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {opt.icon && <span className="custom-select-opt-icon">{opt.icon}</span>}
                  <span>{opt.label}</span>
                </div>
                {isSelected && (
                  <Check size={16} className="custom-select-check-icon" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default CustomSelect;
