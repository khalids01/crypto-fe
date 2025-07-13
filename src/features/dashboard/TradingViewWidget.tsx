import React, { useEffect, useRef, memo } from 'react';
import { Exchange } from './type.d';

// Add TypeScript declaration for TradingView on window object
declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewWidgetProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  interval?: string;
  exchanges?: Exchange[];
  onSymbolChange?: (symbol: string) => void;
  onIntervalChange?: (interval: string) => void;
  onChartReady?: () => void;
}

function TradingViewWidget({ 
  symbol = "BTC", 
  theme = "dark", 
  interval = "15",
  exchanges = [],
  onSymbolChange,
  onIntervalChange,
  onChartReady
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up any existing content
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Create a unique container ID
    const containerId = `tradingview-widget-${Date.now()}`;
    
    // Create the container element
    if (containerRef.current) {
      const container = document.createElement('div');
      container.id = containerId;
      container.style.width = '100%';
      container.style.height = '100%';
      containerRef.current.appendChild(container);
    } else {
      return;
    }

    // Format the main symbol
    let mainSymbol = "BTCUSDT";
    if (symbol) {
      // Remove any exchange prefix if present
      mainSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
      
      // Add USDT suffix if not already present
      if (!mainSymbol.endsWith('USDT') && !mainSymbol.endsWith('USDC')) {
        mainSymbol = `${mainSymbol}USDT`;
      }
    }
    
    // Generate compare symbols from exchanges
    const compareSymbols: string[] = [];
    if (exchanges && exchanges.length > 0) {
      console.log("Available exchanges:", exchanges);
      
      // Add up to 3 exchanges for comparison
      const exchangesToCompare = exchanges.slice(0, 3);
      
      for (const exchange of exchangesToCompare) {
        if (exchange.exchange && exchange.coinSymbol) {
          // Format exchange name for TradingView
          let exchangeName = exchange.exchange.toUpperCase();
          if (exchangeName === "BINANCE") continue; // Skip Binance as it's our main symbol
          
          // Format the symbol for this exchange
          let exchangeSymbol = exchange.coinSymbol;
          if (!exchangeSymbol.endsWith('USDT') && !exchangeSymbol.endsWith('USDC')) {
            exchangeSymbol = `${exchangeSymbol}USDT`;
          }
          
          compareSymbols.push(`${exchangeName}:${exchangeSymbol}`);
        }
      }
    }
    
    console.log("Main symbol:", mainSymbol);
    console.log("Compare symbols:", compareSymbols);
    
    // Build the URL with comparison symbols
    let iframeUrl = `https://www.tradingview.com/widgetembed/?symbol=BINANCE:${mainSymbol}`;
    
    // Add comparison symbols if available
    if (compareSymbols.length > 0) {
      const compareParam = compareSymbols.map(s => encodeURIComponent(s)).join('%2C');
      iframeUrl += `&compare=${compareParam}`;
    }
    
    // Add remaining parameters
    iframeUrl += `&interval=${interval}&hidesidetoolbar=0&symboledit=1&saveimage=1`;
    iframeUrl += `&toolbarbg=f1f3f6&studies=%5B%5D&theme=${theme}&style=1`;
    iframeUrl += `&timezone=Etc%2FUTC&withdateranges=1&showpopupbutton=1&studies_overrides=%7B%7D`;
    iframeUrl += `&enablepublishing=false&withdateranges=true&hidetoptoolbar=0&hidelegend=0`;
    // Explicitly enable drawing tools
    iframeUrl += `&hidesidetoolbar=0&details=true&calendar=false&hotlist=false&show_popup_button=1`;
    
    // Use TradingView's Advanced Chart widget for full feature set including drawing tools
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined') {
        const widgetOptions = {
          autosize: true,
          symbol: `BINANCE:${mainSymbol}`,
          interval: interval,
          timezone: 'Etc/UTC',
          theme: theme,
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: containerId,
          hide_side_toolbar: false, // Explicitly show side toolbar with drawing tools
          studies: [],
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
          compare_symbols: compareSymbols,
          withdateranges: true,
          save_image: true,
          details: true,
          hotlist: false,
          calendar: false,
          hide_volume: false,
          // Enable drawing tools
          drawings_access: { type: 'all', tools: [ { name: 'all_drawing_tools' } ] },
          // Event handlers
          saved_data_callback: (data: any) => {
            console.log('Chart data saved:', data);
          },
          custom_css_url: '',
          loading_screen: { backgroundColor: "transparent" },
          // Don't use onChartReady here as we'll handle it separately
          datafeed: {
            onReady: (callback: any) => {
              setTimeout(() => callback({}), 0);
            }
          }
        };

        // Create the widget
        const widget = new window.TradingView.widget(widgetOptions);
        
        // Store widget in a global variable for debugging
        (window as any).tvWidget = widget;
        
        // Set up event listeners after widget is ready
        if (typeof widget.onChartReady === 'function') {
          let symbolButton: HTMLButtonElement | null = null;
          let checkInterval: NodeJS.Timeout | null = null;
          
          widget.onChartReady(() => {
            console.log('Chart is ready');
            if (onChartReady) onChartReady();
            
            // Create a button to get the current symbol
            symbolButton = document.createElement('button');
            symbolButton.style.display = 'none';
            symbolButton.id = 'tv-symbol-button';
            document.body.appendChild(symbolButton);
          
            // Set up a periodic check for symbol and interval changes
            checkInterval = setInterval(() => {
              try {
                if (widget && widget.activeChart) {
                  const currentSymbol = widget.activeChart().symbol();
                  const currentInterval = widget.activeChart().resolution();
                  
                  // Extract the base symbol without exchange prefix
                  const baseSymbol = currentSymbol.includes(':') ? 
                    currentSymbol.split(':')[1] : currentSymbol;
                  
                  // Call the callbacks if provided
                  if (onSymbolChange && baseSymbol !== mainSymbol) {
                    onSymbolChange(baseSymbol);
                    console.log('Symbol changed to:', baseSymbol);
                  }
                  
                  if (onIntervalChange && currentInterval !== interval) {
                    onIntervalChange(currentInterval);
                    console.log('Interval changed to:', currentInterval);
                  }
                }
              } catch (err) {
                console.error('Error checking chart state:', err);
              }
            }, 2000); // Check every 2 seconds
          });
        }
        
        console.log("TradingView Advanced Chart widget created with symbol:", mainSymbol);
      } else {
        console.error("TradingView library not loaded");
      }
    };
    
    // Add the script to the container
    const containerElement = document.getElementById(containerId);
    if (containerElement) {
      containerElement.appendChild(script);
    }
    
    // Log is already handled in the script.onload callback
    
    // Cleanup function
    return () => {
      // Clear any intervals that might be running
      const tvWidget = (window as any).tvWidget;
      if (tvWidget) {
        try {
          // Try to remove the widget properly if possible
          if (typeof tvWidget.remove === 'function') {
            tvWidget.remove();
          }
        } catch (e) {
          console.error('Error removing TradingView widget:', e);
        }
      }
      
      // Also check for the button by ID in case the reference was lost
      const symbolButton = document.getElementById('tv-symbol-button');
      if (symbolButton) {
        symbolButton.remove();
      }
      
      // Clear the container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, theme, interval, exchanges]);

  return (
    <div className="w-full h-full" ref={containerRef}></div>
  );
}

export default memo(TradingViewWidget);
