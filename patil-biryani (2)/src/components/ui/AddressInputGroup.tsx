import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MapPin,
  Building2,
  Navigation,
  Globe2,
  Check,
  Copy,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Info,
  Loader2,
  Search,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  COUNTRIES_DATA,
  findCountry,
  getDistrictsForState,
  formatFullAddress,
  lookupPincodeAsync,
  lookupPincodeOffline,
  PincodeLookupResult,
  CountryInfo,
} from '../../data/geoData';
import { CustomSelect, SelectOption } from './CustomSelect';

export interface AddressFormValues {
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  area?: string;
  district?: string;
  city: string;
  state: string;
  country?: string;
  pinCode: string;
}

interface AddressInputGroupProps {
  values: AddressFormValues;
  onChange: (field: keyof AddressFormValues, value: string) => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  required?: boolean;
  showPreview?: boolean;
  errorMessages?: Partial<Record<keyof AddressFormValues, string>>;
}

export const AddressInputGroup: React.FC<AddressInputGroupProps> = ({
  values,
  onChange,
  title = 'Address & Location Details',
  subtitle = 'Country-wise, State-wise & District-wise interlinked address with instant PIN auto-lookup',
  compact = false,
  required = true,
  showPreview = true,
  errorMessages = {} as Partial<Record<keyof AddressFormValues, string>>,
}) => {
  const [copied, setCopied] = useState(false);
  const [isCustomState, setIsCustomState] = useState(false);
  const [isCustomDistrict, setIsCustomDistrict] = useState(false);
  const [isLoadingPin, setIsLoadingPin] = useState(false);
  const [autoDetectedBadge, setAutoDetectedBadge] = useState<{
    text: string;
    source: string;
  } | null>(null);

  const lastLookupPinRef = useRef<string>('');

  // Normalize current country
  const currentCountryInfo: CountryInfo = useMemo(() => {
    return findCountry(values.country || 'India');
  }, [values.country]);

  // Dynamic States for selected Country
  const availableStates: string[] = useMemo(() => {
    return currentCountryInfo.states;
  }, [currentCountryInfo]);

  // Dynamic Districts for selected State
  const availableDistricts: string[] = useMemo(() => {
    if (!values.state) return [];
    return getDistrictsForState(values.country || 'India', values.state);
  }, [values.country, values.state]);

  // Memoized Country options for CustomSelect
  const countryOptions = useMemo<SelectOption<string>[]>(() => {
    return COUNTRIES_DATA.map((c) => ({
      value: c.name,
      label: c.name,
      sublabel: `${c.code} · ${c.phoneCode} · ${c.states.length > 0 ? `${c.states.length} States/UTs` : 'Global'}`,
      icon: <span className="text-sm">{c.flag}</span>,
      badge: c.name === 'India' ? 'Default' : undefined,
      badgeColor: 'emerald',
    }));
  }, []);

  // Memoized State options for CustomSelect
  const stateOptions = useMemo<SelectOption<string>[]>(() => {
    const opts: SelectOption<string>[] = availableStates.map((st) => ({
      value: st,
      label: st,
      sublabel: values.country || currentCountryInfo.name,
    }));
    opts.push({
      value: '__CUSTOM__',
      label: '+ Other / Custom State...',
      sublabel: 'Type custom state name',
      badge: 'Custom',
      badgeColor: 'cyan',
    });
    return opts;
  }, [availableStates, values.country, currentCountryInfo.name]);

  // Memoized District options for CustomSelect
  const districtOptions = useMemo<SelectOption<string>[]>(() => {
    const opts: SelectOption<string>[] = availableDistricts.map((dst) => ({
      value: dst,
      label: dst,
      sublabel: `${values.state || 'State'} District`,
    }));
    opts.push({
      value: '__CUSTOM__',
      label: '+ Other / Custom District...',
      sublabel: 'Type custom district name',
      badge: 'Custom',
      badgeColor: 'cyan',
    });
    return opts;
  }, [availableDistricts, values.state]);

  // Automatic PIN Code Lookup Process
  const performPinLookup = async (pinInput: string, force = false) => {
    const cleanPin = (pinInput || '').trim();
    if (!cleanPin) {
      setAutoDetectedBadge(null);
      return;
    }

    // Only auto-trigger for 6-digit PIN in India, or when forced
    const isIndia = (values.country || 'India').toLowerCase() === 'india';
    if (isIndia && cleanPin.length !== 6 && !force) {
      return;
    }

    if (!force && lastLookupPinRef.current === cleanPin) {
      return;
    }
    lastLookupPinRef.current = cleanPin;

    // 1. Instant local offline lookup (0ms feedback)
    const instantResult = lookupPincodeOffline(cleanPin);
    if (instantResult) {
      if (instantResult.state) {
        onChange('state', instantResult.state);
        setIsCustomState(false);
      }
      if (instantResult.district) {
        onChange('district', instantResult.district);
        setIsCustomDistrict(false);
      }
      if (instantResult.city && (!values.city || values.city.trim().length === 0)) {
        onChange('city', instantResult.city);
      }
      if (instantResult.area && (!values.landmark && !values.area)) {
        onChange('landmark', instantResult.area);
        onChange('area', instantResult.area);
      }

      setAutoDetectedBadge({
        text: `${instantResult.district || instantResult.city}, ${instantResult.state}`,
        source: 'Instant Offline DB',
      });
    }

    // 2. Asynchronous Postal API verification (for pinpoint village/sub-district & live Post Office lookup)
    if (isIndia && cleanPin.length === 6) {
      setIsLoadingPin(true);
      try {
        const liveResult: PincodeLookupResult | null = await lookupPincodeAsync(cleanPin);
        if (liveResult) {
          if (liveResult.state) {
            onChange('state', liveResult.state);
            setIsCustomState(false);
          }
          if (liveResult.district) {
            onChange('district', liveResult.district);
            setIsCustomDistrict(false);
          }
          if (liveResult.city) {
            onChange('city', liveResult.city);
          }
          if (liveResult.area && (!values.landmark && !values.area)) {
            onChange('landmark', liveResult.area);
            onChange('area', liveResult.area);
          }

          setAutoDetectedBadge({
            text: `${liveResult.district || liveResult.city}, ${liveResult.state}`,
            source: liveResult.source === 'postal_api' ? 'Official Postal Registry' : 'Verified Database',
          });
        }
      } catch (err) {
        // Fallback already handled
      } finally {
        setIsLoadingPin(false);
      }
    }
  };

  // Debounced auto-fetch effect when user types PIN code
  useEffect(() => {
    const rawPin = values.pinCode || '';
    const cleanPin = rawPin.trim();

    if (cleanPin.length === 6 && (values.country || 'India').toLowerCase() === 'india') {
      const timer = setTimeout(() => {
        performPinLookup(cleanPin);
      }, 300);
      return () => clearTimeout(timer);
    } else if (cleanPin.length === 0) {
      setAutoDetectedBadge(null);
      lastLookupPinRef.current = '';
    }
  }, [values.pinCode, values.country]);

  // Handle Country Selection & update dependent state & districts
  const handleCountrySelect = (selectedCountryName: string) => {
    onChange('country', selectedCountryName);

    const newCountryInfo = findCountry(selectedCountryName);
    const newStates = newCountryInfo.states;

    if (newStates.length > 0) {
      if (!newStates.includes(values.state)) {
        const defaultState = newStates[0] || '';
        onChange('state', defaultState);
        setIsCustomState(false);

        // Update district for the new state
        const newDistricts = getDistrictsForState(selectedCountryName, defaultState);
        if (newDistricts.length > 0) {
          onChange('district', newDistricts[0] || '');
          setIsCustomDistrict(false);
        } else {
          onChange('district', '');
        }
      }
    } else {
      setIsCustomState(true);
      setIsCustomDistrict(true);
    }
    setAutoDetectedBadge(null);
  };

  // State selection change -> cascades to District
  const handleStateSelect = (selectedState: string) => {
    if (selectedState === '__CUSTOM__') {
      setIsCustomState(true);
      onChange('state', '');
      onChange('district', '');
    } else {
      setIsCustomState(false);
      onChange('state', selectedState);

      // Auto-set or reset district to match selected state
      const districtsForNewState = getDistrictsForState(values.country || 'India', selectedState);
      if (districtsForNewState.length > 0) {
        if (!districtsForNewState.includes(values.district || '')) {
          onChange('district', districtsForNewState[0]);
          setIsCustomDistrict(false);
        }
      } else {
        onChange('district', '');
      }
    }
  };

  // District selection change
  const handleDistrictSelect = (selectedDistrict: string) => {
    if (selectedDistrict === '__CUSTOM__') {
      setIsCustomDistrict(true);
      onChange('district', '');
    } else {
      setIsCustomDistrict(false);
      onChange('district', selectedDistrict);

      // If city is empty or was previously the old district, auto-populate with the district name
      if (!values.city || values.city.trim().length === 0) {
        // Strip out parenthetical text (e.g. "Belagavi (Belgaum)" -> "Belagavi")
        const cleanCityName = selectedDistrict.split('(')[0].trim();
        onChange('city', cleanCityName);
      }
    }
  };

  // Live formatted address string
  const formattedAddress = useMemo(() => {
    return formatFullAddress({
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2,
      landmark: values.landmark || values.area,
      district: values.district,
      city: values.city,
      state: values.state,
      country: values.country || currentCountryInfo.name,
      pinCode: values.pinCode,
    });
  }, [values, currentCountryInfo]);

  // Copy formatted address
  const handleCopy = () => {
    if (!formattedAddress) return;
    navigator.clipboard.writeText(formattedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Field-level Validation Status Computations
  const address1Status: 'valid' | 'invalid' | 'neutral' = useMemo(() => {
    const text = (values.addressLine1 || '').trim();
    if (errorMessages.addressLine1) return 'invalid';
    if (!text) return required ? 'invalid' : 'neutral';
    return text.length >= 3 ? 'valid' : 'invalid';
  }, [values.addressLine1, required, errorMessages.addressLine1]);

  const districtStatus: 'valid' | 'invalid' | 'neutral' = useMemo(() => {
    const text = (values.district || '').trim();
    if (errorMessages.district) return 'invalid';
    if (!text) return required ? 'invalid' : 'neutral';
    return text.length >= 2 ? 'valid' : 'invalid';
  }, [values.district, required, errorMessages.district]);

  const cityStatus: 'valid' | 'invalid' | 'neutral' = useMemo(() => {
    const text = (values.city || '').trim();
    if (errorMessages.city) return 'invalid';
    if (!text) return required ? 'invalid' : 'neutral';
    return text.length >= 2 ? 'valid' : 'invalid';
  }, [values.city, required, errorMessages.city]);

  const stateStatus: 'valid' | 'invalid' | 'neutral' = useMemo(() => {
    const text = (values.state || '').trim();
    if (errorMessages.state) return 'invalid';
    if (!text) return required ? 'invalid' : 'neutral';
    return text.length >= 2 ? 'valid' : 'invalid';
  }, [values.state, required, errorMessages.state]);

  // Postal code validation check
  const isPostalCodeValid = useMemo(() => {
    if (!values.pinCode || !values.pinCode.trim()) return true;
    if (currentCountryInfo.postalCodePattern) {
      return currentCountryInfo.postalCodePattern.test(values.pinCode.trim());
    }
    return values.pinCode.trim().length >= 3;
  }, [values.pinCode, currentCountryInfo]);

  const pinCodeStatus: 'valid' | 'invalid' | 'neutral' = useMemo(() => {
    const text = (values.pinCode || '').trim();
    if (errorMessages.pinCode) return 'invalid';
    if (!text) return required ? 'invalid' : 'neutral';
    if (!isPostalCodeValid) return 'invalid';
    if (currentCountryInfo.postalCodePattern) {
      return currentCountryInfo.postalCodePattern.test(text) ? 'valid' : 'invalid';
    }
    return text.length >= 3 ? 'valid' : 'invalid';
  }, [values.pinCode, required, isPostalCodeValid, currentCountryInfo, errorMessages.pinCode]);

  // Overall form validation completeness
  const isValidOverall = useMemo(() => {
    if (!required) return true;
    return (
      address1Status === 'valid' &&
      cityStatus === 'valid' &&
      stateStatus === 'valid' &&
      pinCodeStatus === 'valid'
    );
  }, [required, address1Status, cityStatus, stateStatus, pinCodeStatus]);

  return (
    <div
      id="address-input-group-container"
      className={`rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-sm transition-all shadow-lg ${
        compact ? 'p-3.5 sm:p-4 space-y-3' : 'p-4 sm:p-5 space-y-4'
      }`}
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm">
            <MapPin className="h-4 w-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold text-slate-100 tracking-wide">
                {title}
              </h4>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-amber-300" />
                <span>Country → State → District Interlinked</span>
              </span>
              {required && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border transition-all ${
                    isValidOverall
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isValidOverall ? (
                    <>
                      <Check className="h-3 w-3 stroke-[3]" />
                      <span>Address Valid</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3" />
                      <span>Required Fields Pending</span>
                    </>
                  )}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Selected Country Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold text-slate-300 shadow-sm">
          <span className="text-sm">{currentCountryInfo.flag}</span>
          <span className="text-[11px] text-slate-200 font-bold">
            {currentCountryInfo.name}
          </span>
          <span className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400 ml-0.5" title="Country active">
            <Check className="h-3 w-3 stroke-[3]" />
          </span>
        </div>
      </div>

      {/* Auto-detected PIN Code Banner */}
      {autoDetectedBadge && (
        <div
          id="pin-autodetect-banner"
          className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs animate-fadeIn"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            </div>
            <div>
              <span className="font-bold text-emerald-200">
                ⚡ Auto-detected from PIN {values.pinCode}:
              </span>{' '}
              <span className="font-semibold text-slate-100">
                {autoDetectedBadge.text}
              </span>
              <span className="ml-2 text-[10px] text-emerald-400/80 uppercase tracking-wider font-semibold">
                ({autoDetectedBadge.source})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoDetectedBadge(null)}
            className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10"
            title="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid of Inputs */}
      <div className="space-y-3">
        {/* Row 1: Address Line 1 & Address Line 2 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                <span>Address Line 1</span>
                {required && <span className="text-rose-400 font-black">*</span>}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Shop/Door No., Building, Street
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                id="address-line-1-input"
                type="text"
                required={required}
                value={values.addressLine1 ?? ''}
                onChange={(e) => onChange('addressLine1', e.target.value)}
                placeholder="e.g. Shop No. 4 & 5, Market Yard"
                className={`w-full glass-input pl-3 pr-9 py-2 text-xs text-slate-100 rounded-xl transition-all ${
                  address1Status === 'valid'
                    ? 'border-emerald-500/40 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/20'
                    : address1Status === 'invalid'
                    ? 'border-rose-500/70 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30'
                    : 'focus:border-emerald-500/60'
                }`}
              />
              {/* Validation Status Icon */}
              <div className="absolute right-2.5 pointer-events-none flex items-center">
                {address1Status === 'valid' ? (
                  <span
                    className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                    title="Address Line 1 meets requirement (min 3 characters)"
                  >
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                ) : address1Status === 'invalid' ? (
                  <span
                    className="flex items-center justify-center h-5 w-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm"
                    title={errorMessages.addressLine1 || 'Required (minimum 3 characters)'}
                  >
                    <AlertTriangle className="h-3 w-3 stroke-[2.5]" />
                  </span>
                ) : null}
              </div>
            </div>
            {errorMessages.addressLine1 && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{errorMessages.addressLine1}</span>
              </p>
            )}
          </div>

          <div className="md:col-span-5">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1">
              <span>Address Line 2</span>
              <span className="text-[10px] text-slate-500 font-normal">
                Floor, Wing, Area (Optional)
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                id="address-line-2-input"
                type="text"
                value={values.addressLine2 ?? ''}
                onChange={(e) => onChange('addressLine2', e.target.value)}
                placeholder="e.g. 1st Floor, Near Central Bazar"
                className={`w-full glass-input pl-3 pr-9 py-2 text-xs text-slate-200 rounded-xl focus:border-emerald-500/60 ${
                  values.addressLine2 && values.addressLine2.trim().length > 0
                    ? 'border-emerald-500/30'
                    : ''
                }`}
              />
              {values.addressLine2 && values.addressLine2.trim().length > 0 && (
                <div className="absolute right-2.5 pointer-events-none flex items-center">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Landmark & PIN / ZIP Code (with Instant Auto-Detect Engine) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                <Navigation className="h-3 w-3 text-amber-400/80" />
                <span>Landmark / Colony / Area</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Key Reference Point (Optional)
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                id="landmark-area-input"
                type="text"
                value={values.landmark || values.area || ''}
                onChange={(e) => {
                  onChange('landmark', e.target.value);
                  onChange('area', e.target.value);
                }}
                placeholder="e.g. Opp. Town Hall / Shivaji Chowk / Shahupuri"
                className={`w-full glass-input pl-3 pr-9 py-2 text-xs text-slate-200 rounded-xl focus:border-emerald-500/60 ${
                  (values.landmark || values.area || '').trim().length > 0
                    ? 'border-emerald-500/30'
                    : ''
                }`}
              />
              {(values.landmark || values.area || '').trim().length > 0 && (
                <div className="absolute right-2.5 pointer-events-none flex items-center">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* PIN / ZIP Code with Instant Lookup Button & Visual Validation */}
          <div className="sm:col-span-5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <span className="text-emerald-400 font-bold">⚡</span>
                <span>{currentCountryInfo.postalCodeLabel}</span>
                {required && <span className="text-rose-400 font-black">*</span>}
              </label>
              <div className="flex items-center gap-1.5">
                {isLoadingPin ? (
                  <span className="flex items-center gap-1 text-[10px] text-teal-300 font-semibold animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Auto-fetching...</span>
                  </span>
                ) : pinCodeStatus === 'valid' ? (
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-semibold">
                    <Check className="h-3 w-3 stroke-[3]" />
                    <span>Valid</span>
                  </span>
                ) : pinCodeStatus === 'invalid' ? (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-semibold">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Required</span>
                  </span>
                ) : null}

                {/* Manual Trigger Button */}
                <button
                  type="button"
                  id="btn-auto-lookup-pin"
                  onClick={() => performPinLookup(values.pinCode || '', true)}
                  className="text-[10px] text-teal-400 hover:text-teal-300 underline font-semibold flex items-center gap-0.5 transition-colors"
                  title="Auto-detect District and State from this PIN Code"
                >
                  <RefreshCw className="h-2.5 w-2.5" />
                  <span>Auto-detect</span>
                </button>
              </div>
            </div>

            <div className="relative flex items-center">
              <input
                id="pin-code-input"
                type="text"
                required={required}
                maxLength={10}
                value={values.pinCode ?? ''}
                onChange={(e) => onChange('pinCode', e.target.value)}
                placeholder={currentCountryInfo.postalCodePlaceholder}
                className={`w-full glass-input pl-3 pr-9 py-2 text-xs font-mono font-bold rounded-xl transition-all ${
                  pinCodeStatus === 'valid'
                    ? 'border-emerald-500/40 text-emerald-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/20'
                    : pinCodeStatus === 'invalid'
                    ? 'border-amber-500/80 text-amber-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-500/30'
                    : 'text-slate-100 focus:border-emerald-500/60'
                }`}
              />
              {/* Validation Status / Loader Icon */}
              <div className="absolute right-2.5 pointer-events-none flex items-center">
                {isLoadingPin ? (
                  <Loader2 className="h-4 w-4 text-teal-400 animate-spin" />
                ) : pinCodeStatus === 'valid' ? (
                  <span
                    className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                    title={`Valid ${currentCountryInfo.name} ${currentCountryInfo.postalCodeLabel}`}
                  >
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                ) : pinCodeStatus === 'invalid' ? (
                  <span
                    className="flex items-center justify-center h-5 w-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm"
                    title={
                      errorMessages.pinCode ||
                      `Format: ${currentCountryInfo.postalCodePlaceholder}`
                    }
                  >
                    <AlertTriangle className="h-3 w-3 stroke-[2.5]" />
                  </span>
                ) : null}
              </div>
            </div>
            {errorMessages.pinCode && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{errorMessages.pinCode}</span>
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Inter-linked Dropdowns: Country → State → District → City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Country Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Globe2 className="h-3 w-3 text-emerald-400/80" />
                <span>Country</span>
                {required && <span className="text-rose-400 font-black">*</span>}
              </label>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                <Check className="h-3 w-3 stroke-[3]" />
                <span>Valid</span>
              </span>
            </div>
            <CustomSelect<string>
              id="country-select"
              value={values.country || currentCountryInfo.name}
              onChange={handleCountrySelect}
              options={countryOptions}
              searchable
              placeholder="Select Country"
              size="sm"
              buttonClassName="py-2 text-xs rounded-xl font-semibold border-emerald-500/40"
            />
          </div>

          {/* 2. State / Province (Inter-linked to Country) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <span>State / Province</span>
                {required && <span className="text-rose-400 font-black">*</span>}
              </label>
              <div className="flex items-center gap-1.5">
                {stateStatus === 'valid' ? (
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-semibold">
                    <Check className="h-3 w-3 stroke-[3]" />
                    <span>Valid</span>
                  </span>
                ) : stateStatus === 'invalid' ? (
                  <span className="flex items-center gap-0.5 text-[10px] text-rose-400 font-semibold">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Required</span>
                  </span>
                ) : null}
                {availableStates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCustomState(!isCustomState)}
                    className="text-[10px] text-teal-400 hover:text-teal-300 underline font-medium transition-colors"
                  >
                    {isCustomState ? 'Choose list' : 'Type custom'}
                  </button>
                )}
              </div>
            </div>

            {availableStates.length > 0 && !isCustomState ? (
              <CustomSelect<string>
                id="state-select"
                value={values.state ?? ''}
                onChange={handleStateSelect}
                options={stateOptions}
                searchable
                placeholder={`-- Select ${currentCountryInfo.name} State --`}
                size="sm"
                buttonClassName={`py-2 text-xs rounded-xl font-semibold transition-all ${
                  stateStatus === 'valid'
                    ? 'border-emerald-500/40'
                    : stateStatus === 'invalid'
                    ? 'border-rose-500/70'
                    : ''
                }`}
              />
            ) : (
              <div className="relative flex items-center">
                <input
                  id="state-custom-input"
                  type="text"
                  required={required}
                  value={values.state ?? ''}
                  onChange={(e) => onChange('state', e.target.value)}
                  placeholder="Enter State / Province name"
                  className={`w-full glass-input pl-3 pr-9 py-2 text-xs text-slate-100 rounded-xl font-semibold transition-all ${
                    stateStatus === 'valid'
                      ? 'border-emerald-500/40 focus:border-emerald-400'
                      : stateStatus === 'invalid'
                      ? 'border-rose-500/70 focus:border-rose-400'
                      : 'focus:border-emerald-500/60'
                  }`}
                />
                <div className="absolute right-2.5 pointer-events-none flex items-center">
                  {stateStatus === 'valid' ? (
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  ) : stateStatus === 'invalid' ? (
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      <AlertTriangle className="h-3 w-3 stroke-[2.5]" />
                    </span>
                  ) : null}
                </div>
              </div>
            )}
            {errorMessages.state && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{errorMessages.state}</span>
              </p>
            )}
          </div>

          {/* 3. District (Inter-linked to State & Country) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-cyan-400/80" />
                <span>District</span>
                {required && <span className="text-rose-400 font-black">*</span>}
              </label>
              <div className="flex items-center gap-1.5">
                {districtStatus === 'valid' ? (
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-semibold">
                    <Check className="h-3 w-3 stroke-[3]" />
                    <span>Valid</span>
                  </span>
                ) : districtStatus === 'invalid' ? (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-semibold">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Required</span>
                  </span>
                ) : null}
                {availableDistricts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCustomDistrict(!isCustomDistrict)}
                    className="text-[10px] text-teal-400 hover:text-teal-300 underline font-medium transition-colors"
                  >
                    {isCustomDistrict ? 'Choose list' : 'Type custom'}
                  </button>
                )}
              </div>
            </div>

            {availableDistricts.length > 0 && !isCustomDistrict ? (
              <CustomSelect<string>
                id="district-select"
                value={values.district ?? ''}
                onChange={handleDistrictSelect}
                options={districtOptions}
                searchable
                placeholder={`-- Select ${values.state || 'State'} District --`}
                size="sm"
                buttonClassName={`py-2 text-xs rounded-xl font-semibold transition-all ${
                  districtStatus === 'valid'
                    ? 'border-emerald-500/40'
                    : districtStatus === 'invalid'
                    ? 'border-amber-500/70'
                    : ''
                }`}
              />
            ) : (
              <div className="relative flex items-center">
                <input
                  id="district-custom-input"
                  type="text"
                  value={values.district ?? ''}
                  onChange={(e) => onChange('district', e.target.value)}
                  placeholder="Enter District name"
                  className={`w-full glass-input pl-3 pr-9 py-2 text-xs text-slate-100 rounded-xl font-semibold transition-all ${
                    districtStatus === 'valid'
                      ? 'border-emerald-500/40 focus:border-emerald-400'
                      : districtStatus === 'invalid'
                      ? 'border-amber-500/70 focus:border-amber-400'
                      : 'focus:border-cyan-500/60'
                  }`}
                />
                <div className="absolute right-2.5 pointer-events-none flex items-center">
                  {districtStatus === 'valid' ? (
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  ) : districtStatus === 'invalid' ? (
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      <AlertTriangle className="h-3 w-3 stroke-[2.5]" />
                    </span>
                  ) : null}
                </div>
              </div>
            )}
            {errorMessages.district && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{errorMessages.district}</span>
              </p>
            )}
          </div>

          {/* 4. City / Town / Taluka */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <span>City / Town / Taluka</span>
                {required && <span className="text-rose-400 font-black">*</span>}
              </label>
              <div className="flex items-center gap-1">
                {cityStatus === 'valid' ? (
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-semibold">
                    <Check className="h-3 w-3 stroke-[3]" />
                    <span>Valid</span>
                  </span>
                ) : cityStatus === 'invalid' ? (
                  <span className="flex items-center gap-0.5 text-[10px] text-rose-400 font-semibold">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Required</span>
                  </span>
                ) : null}
              </div>
            </div>
            <div className="relative flex items-center">
              <input
                id="city-town-input"
                type="text"
                required={required}
                value={values.city ?? ''}
                onChange={(e) => onChange('city', e.target.value)}
                placeholder="e.g. Kolhapur / Ichalkaranji"
                className={`w-full glass-input pl-3 pr-9 py-2 text-xs text-slate-100 rounded-xl font-medium transition-all ${
                  cityStatus === 'valid'
                    ? 'border-emerald-500/40 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/20'
                    : cityStatus === 'invalid'
                    ? 'border-rose-500/70 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30'
                    : 'focus:border-emerald-500/60'
                }`}
              />
              {/* Validation Status Icon */}
              <div className="absolute right-2.5 pointer-events-none flex items-center">
                {cityStatus === 'valid' ? (
                  <span
                    className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                    title="City entered and valid"
                  >
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                ) : cityStatus === 'invalid' ? (
                  <span
                    className="flex items-center justify-center h-5 w-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm"
                    title={errorMessages.city || 'City name is required (min 2 letters)'}
                  >
                    <AlertTriangle className="h-3 w-3 stroke-[2.5]" />
                  </span>
                ) : null}
              </div>
            </div>
            {errorMessages.city && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{errorMessages.city}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Live Formatted Address Preview & Quick Copy */}
      {showPreview && (
        <div
          id="formatted-address-preview-box"
          className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
        >
          <div className="flex items-start gap-2 text-xs text-slate-300 min-w-0">
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Live Bill / Invoice Header Preview:
              </span>
              <p className="text-slate-200 font-medium text-xs truncate sm:text-clip mt-0.5">
                {formattedAddress || (
                  <span className="italic text-slate-500">
                    Fill the fields above to preview formatted address on bills &amp; slips...
                  </span>
                )}
              </p>
            </div>
          </div>

          {formattedAddress && (
            <button
              type="button"
              id="btn-copy-formatted-address"
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all shrink-0 border border-white/10"
              title="Copy formatted address string"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[2.5]" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy Address</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
