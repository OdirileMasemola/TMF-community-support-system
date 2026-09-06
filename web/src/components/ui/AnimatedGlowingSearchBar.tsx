import { cn } from "@/lib/utils";

type AnimatedGlowingSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function AnimatedGlowingSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: AnimatedGlowingSearchBarProps) {
  return (
    <div className={cn("relative isolate mx-auto flex w-full max-w-[680px] items-center justify-center", className)}>
      <div className="relative flex w-full max-w-[680px] items-center justify-center group">
        <div className="absolute z-[-1] h-[58px] w-[calc(100%+10px)] max-w-[700px] overflow-hidden rounded-2xl opacity-40 blur-[2px] transition-opacity duration-300 before:absolute before:left-1/2 before:top-1/2 before:z-[-2] before:h-[999px] before:w-[999px] before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[60deg] before:bg-[conic-gradient(rgba(0,0,0,0),rgba(64,47,181,0.55)_5%,rgba(0,0,0,0)_38%,rgba(0,0,0,0)_50%,rgba(207,48,170,0.45)_60%,rgba(0,0,0,0)_87%)] before:bg-no-repeat before:content-[''] before:transition-all before:duration-[2000ms] group-hover:opacity-50 group-hover:before:rotate-[-120deg] group-focus-within:opacity-60 group-focus-within:before:rotate-[420deg] group-focus-within:before:duration-[4000ms]" />
        <div className="absolute z-[-1] h-[54px] w-[calc(100%+8px)] max-w-[696px] overflow-hidden rounded-2xl opacity-35 blur-[2px] transition-opacity duration-300 before:absolute before:left-1/2 before:top-1/2 before:z-[-2] before:h-[900px] before:w-[900px] before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[82deg] before:bg-[conic-gradient(rgba(0,0,0,0),rgba(24,17,106,0.45),rgba(0,0,0,0)_10%,rgba(0,0,0,0)_50%,rgba(110,27,96,0.4),rgba(0,0,0,0)_60%)] before:bg-no-repeat before:content-[''] before:transition-all before:duration-[2000ms] group-hover:opacity-45 group-hover:before:rotate-[-98deg] group-focus-within:opacity-55 group-focus-within:before:rotate-[442deg] group-focus-within:before:duration-[4000ms]" />
        <div className="absolute z-[-1] h-[54px] w-[calc(100%+8px)] max-w-[696px] overflow-hidden rounded-2xl opacity-30 blur-[2px] transition-opacity duration-300 before:absolute before:left-1/2 before:top-1/2 before:z-[-2] before:h-[900px] before:w-[900px] before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[82deg] before:bg-[conic-gradient(rgba(0,0,0,0),rgba(24,17,106,0.38),rgba(0,0,0,0)_10%,rgba(0,0,0,0)_50%,rgba(110,27,96,0.35),rgba(0,0,0,0)_60%)] before:bg-no-repeat before:content-[''] before:transition-all before:duration-[2000ms] group-hover:opacity-40 group-hover:before:rotate-[-98deg] group-focus-within:opacity-50 group-focus-within:before:rotate-[442deg] group-focus-within:before:duration-[4000ms]" />
        <div className="absolute z-[-1] h-[54px] w-[calc(100%+8px)] max-w-[696px] overflow-hidden rounded-2xl opacity-25 blur-[1.5px] transition-opacity duration-300 before:absolute before:left-1/2 before:top-1/2 before:z-[-2] before:h-[900px] before:w-[900px] before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[82deg] before:bg-[conic-gradient(rgba(0,0,0,0),rgba(24,17,106,0.35),rgba(0,0,0,0)_10%,rgba(0,0,0,0)_50%,rgba(110,27,96,0.32),rgba(0,0,0,0)_60%)] before:bg-no-repeat before:content-[''] before:transition-all before:duration-[2000ms] group-hover:opacity-35 group-hover:before:rotate-[-98deg] group-focus-within:opacity-45 group-focus-within:before:rotate-[442deg] group-focus-within:before:duration-[4000ms]" />

        <div className="absolute z-[-1] h-[52px] w-[calc(100%+4px)] max-w-[692px] overflow-hidden rounded-xl opacity-30 blur-[1.5px] transition-opacity duration-300 before:absolute before:left-1/2 before:top-1/2 before:z-[-2] before:h-[900px] before:w-[900px] before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[83deg] before:bg-[conic-gradient(rgba(0,0,0,0)_0%,rgba(160,153,216,0.45),rgba(0,0,0,0)_8%,rgba(0,0,0,0)_50%,rgba(223,162,218,0.4),rgba(0,0,0,0)_58%)] before:bg-no-repeat before:content-[''] before:transition-all before:duration-[2000ms] group-hover:opacity-40 group-hover:before:rotate-[-97deg] group-focus-within:opacity-50 group-focus-within:before:rotate-[443deg] group-focus-within:before:duration-[4000ms]" />

        <div className="absolute z-[-1] h-[50px] w-[calc(100%+2px)] max-w-[688px] overflow-hidden rounded-xl opacity-35 blur-[0.5px] transition-opacity duration-300 before:absolute before:left-1/2 before:top-1/2 before:z-[-2] before:h-[900px] before:w-[900px] before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[70deg] before:bg-[conic-gradient(rgba(28,25,28,0.35),rgba(64,47,181,0.42)_5%,rgba(28,25,28,0.25)_14%,rgba(28,25,28,0.25)_50%,rgba(207,48,170,0.35)_60%,rgba(28,25,28,0.25)_64%)] before:bg-no-repeat before:content-[''] before:transition-all before:duration-[2000ms] group-hover:opacity-45 group-hover:before:rotate-[-110deg] group-focus-within:opacity-55 group-focus-within:before:rotate-[430deg] group-focus-within:before:duration-[4000ms]" />

        <div className="relative w-full group">
          <label htmlFor="campaign-search" className="sr-only">
            Search campaigns
          </label>
          <input
            id="campaign-search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            type="search"
            name="campaign-search"
            className="h-12 w-full rounded-xl border border-[var(--glow-search-inner-border)] bg-[var(--glow-search-bg)] pl-14 pr-24 text-base text-[var(--glow-search-text)] outline-none transition-colors placeholder:text-[var(--glow-search-placeholder)] focus:outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          />
          {value ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onChange("")}
              className="absolute right-[3.25rem] top-1/2 z-[2] -translate-y-1/2 rounded-md p-1 text-[var(--glow-search-icon)] transition-colors hover:text-[var(--glow-search-text)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : null}
          <div className="pointer-events-none absolute left-[5px] top-1/2 h-[18px] w-[30px] -translate-y-1/2 bg-[#cf30aa]/40 opacity-30 blur-lg transition-all duration-[2000ms] group-hover:opacity-10" />
          <div className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 overflow-hidden rounded-lg opacity-60 before:absolute before:left-1/2 before:top-1/2 before:h-[600px] before:w-[600px] before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-90 before:animate-[spin_4s_linear_infinite] before:bg-[conic-gradient(rgba(0,0,0,0),rgba(61,58,79,0.55),rgba(0,0,0,0)_50%,rgba(0,0,0,0)_50%,rgba(61,58,79,0.55),rgba(0,0,0,0)_100%)] before:bg-no-repeat before:content-['']" />
          <div
            aria-hidden="true"
            className="absolute right-2 top-1/2 z-[2] flex h-9 w-9 -translate-y-1/2 items-center justify-center overflow-hidden rounded-lg border border-transparent [isolation:isolate]"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, var(--glow-search-filter-bg-start), var(--glow-search-filter-bg-middle), var(--glow-search-filter-bg-end))",
            }}
          >
            <svg
              preserveAspectRatio="none"
              height="27"
              width="27"
              viewBox="4.8 4.56 14.832 15.408"
              fill="none"
            >
              <path
                d="M8.16 6.65002H15.83C16.47 6.65002 16.99 7.17002 16.99 7.81002V9.09002C16.99 9.56002 16.7 10.14 16.41 10.43L13.91 12.64C13.56 12.93 13.33 13.51 13.33 13.98V16.48C13.33 16.83 13.1 17.29 12.81 17.47L12 17.98C11.24 18.45 10.2 17.92 10.2 16.99V13.91C10.2 13.5 9.97 12.98 9.73 12.69L7.52 10.36C7.23 10.08 7 9.55002 7 9.20002V7.87002C7 7.17002 7.52 6.65002 8.16 6.65002Z"
                stroke="var(--glow-search-filter-icon)"
                strokeWidth="1"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div aria-hidden="true" className="absolute left-5 top-1/2 -translate-y-1/2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              height="24"
              fill="none"
              className="feather feather-search"
            >
              <circle stroke="var(--glow-search-icon)" r="8" cy="11" cx="11" />
              <line stroke="var(--glow-search-icon)" y2="16.65" y1="22" x2="16.65" x1="22" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
