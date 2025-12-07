import React, { useState, useEffect } from 'react';
import { Copy, Check, TrendingUp, TrendingDown, Upload, Wand2, Download, RefreshCw } from 'lucide-react';
import { useScrollReveal } from './hooks/useScrollReveal';
import { GoogleGenAI } from "@google/genai";

const CA = "57hpStXvz9H4HktqhY23KFwBhs48rASn5GWNrcFpbonk";
const IMAGE_URL = "https://pbs.twimg.com/media/G7BY0wQXcAAaE0Q?format=jpg&name=medium";

interface MarketData {
  mcap: number;
  change: number;
}

const formatMcap = (num: number) => {
  if (num >= 1000000000) {
    return `$${(num / 1000000000).toFixed(2)}B`;
  }
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
};

const XLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const App: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  
  // PFP Generator State
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  useScrollReveal();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CA}`);
        const data = await response.json();
        if (data.pairs && data.pairs.length > 0) {
          const pair = data.pairs[0];
          setMarketData({
            mcap: pair.fdv || pair.marketCap || 0,
            change: pair.priceChange.h24
          });
        }
      } catch (error) {
        console.error("Error fetching market data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); 
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(CA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadImage(reader.result as string);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateBonkPfp = async () => {
    if (!uploadFile) return;
    
    // Check for API Key
    if (!process.env.API_KEY) {
      alert("Error: API Key is missing. Please make sure you have added 'API_KEY' to your Vercel Environment Variables and redeployed.");
      console.error("API_KEY is not defined in process.env");
      return;
    }

    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        }
        reader.readAsDataURL(uploadFile);
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: uploadFile.type
              }
            },
            {
              text: 'Edit this image to create a hilarious "bonk" meme. The character\'s head must be EXTREMELY flattened and squashed vertically, looking like a pancake from a heavy impact. Do NOT show a baseball bat or any weapon. Only show the result of the impact on the head. Add a massive, bold, comic-book style sound effect text "*BONK*" floating right above the flattened head. Make the facial expression look dazed or dizzy. The flattening effect should be very exaggerated and obvious.'
            }
          ]
        }
      });

      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Something went wrong with the bonk machine. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans text-white">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 px-4 py-4">
        <div className="max-w-7xl mx-auto backdrop-blur-md bg-orange-600/90 px-4 sm:px-6 py-3 flex justify-between items-center rounded-3xl border-4 border-[#fbbf24] shadow-[8px_8px_0px_#c2410c] transition-transform hover:-translate-y-1 hover:shadow-[12px_12px_0px_#c2410c]">
          <div className="flex items-center gap-3">
            <img 
              src={IMAGE_URL} 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white bg-yellow-400 object-cover" 
              alt="Cheems Logo" 
            />
            <span className="text-2xl sm:text-3xl font-comic text-white drop-shadow-md hidden sm:block">$CHEEMS</span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Market Cap Widget */}
            {marketData && (
              <a 
                href="https://dexscreener.com/solana/57hpStXvz9H4HktqhY23KFwBhs48rASn5GWNrcFpbonk" 
                target="_blank" 
                rel="noreferrer"
                className="flex flex-col items-end sm:items-center bg-black/20 px-3 py-1 rounded-xl border-2 border-orange-500/50 hover:border-[#fbbf24] transition-all cursor-pointer group hover:bg-black/30"
              >
                <div className="flex items-center gap-1">
                    <span className="text-orange-200 text-xs font-bold mr-1 hidden sm:inline">MCAP:</span>
                    <span className="text-yellow-300 font-mono font-bold tracking-wider text-sm sm:text-base group-hover:scale-105 transition-transform">
                    {formatMcap(marketData.mcap)}
                    </span>
                </div>
                <div className={`text-[10px] sm:text-xs font-bold flex items-center gap-1 ${marketData.change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {marketData.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span>{marketData.change >= 0 ? '+' : ''}{marketData.change}%</span>
                </div>
              </a>
            )}

            <div className="hidden md:flex gap-6 text-lg font-bold tracking-wide text-white">
              <a href="#about" className="hover:text-yellow-200 transition font-comic">LORE</a>
              <a href="#generator" className="hover:text-yellow-200 transition font-comic">BONK MAKER</a>
              <a href="#chart" className="hover:text-yellow-200 transition font-comic">CHART</a>
            </div>

            <a 
              href="https://bonk.fun/token/57hpStXvz9H4HktqhY23KFwBhs48rASn5GWNrcFpbonk" 
              target="_blank"
              rel="noreferrer"
              className="bg-white text-orange-600 border-4 border-orange-600 shadow-[4px_4px_0px_#7c2d12] sm:shadow-[6px_6px_0px_#7c2d12] font-comic px-4 sm:px-6 py-2 rounded-xl text-lg sm:text-xl tracking-wide uppercase transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#7c2d12] sm:hover:shadow-[8px_8px_0px_#7c2d12] active:translate-y-1 active:shadow-none whitespace-nowrap"
            >
              BUY
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-28 sm:pt-24 px-4 relative z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            
          {/* Text Content */}
          <div className="order-2 lg:order-1 space-y-6 text-center lg:text-left reveal">
            <div className="inline-block bg-yellow-400 text-orange-900 px-4 py-1 rounded-full text-sm font-black border-2 border-orange-900 transform -rotate-2">
              THE LEGEND IS BACK
            </div>
            
            <h1 className="text-7xl lg:text-9xl font-black leading-none text-white drop-shadow-[4px_4px_0_rgba(0,0,0,0.2)] font-comic">
              IT'S <br /> <span className="text-yellow-300">CHEEMS</span> TIME
            </h1>
            
            <p className="text-2xl font-bold text-orange-100 max-w-lg mx-auto lg:mx-0">
              I hamve a speech impedimemt. I like Cheemsburbgers.
              The most iconic doge on Solana. Get bonked or get Cheems.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <button 
                onClick={handleCopy} 
                className="bg-yellow-400 text-orange-900 border-4 border-orange-600 shadow-[6px_6px_0px_#7c2d12] px-8 py-4 rounded-xl flex items-center gap-3 justify-center font-comic text-xl transition-all hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_#7c2d12] active:translate-y-1 active:shadow-none"
              >
                {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                <span>{copied ? "COPIED!" : "COPY CA"}</span>
              </button>
              <a 
                href="https://x.com/i/communities/1995174237632663921" 
                target="_blank" 
                rel="noreferrer"
                className="bg-black text-white border-4 border-black shadow-[6px_6px_0px_#7c2d12] px-8 py-4 rounded-xl flex items-center gap-3 justify-center font-comic text-xl transition-all hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_#7c2d12] active:translate-y-1 active:shadow-none"
              >
                <XLogo className="w-6 h-6" />
                <span>COMMUNITY</span>
              </a>
            </div>
            <div className="mt-4">
              <code className="bg-orange-800/50 px-4 py-2 rounded-lg text-sm font-mono text-yellow-200 break-all border border-orange-400 inline-block">
                {CA}
              </code>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="order-1 lg:order-2 flex justify-center relative reveal">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-3xl opacity-30 animate-pulse-slow"></div>
            <img 
              src={IMAGE_URL} 
              className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] object-cover rounded-full border-8 border-white relative z-10 animate-bonk-bounce drop-shadow-2xl" 
              alt="Cheems Doge" 
            />
            
            {/* Floating Elements */}
            <div className="absolute top-0 right-10 text-6xl animate-bounce" style={{ animationDelay: '0.5s' }}>🍔</div>
            <div className="absolute bottom-10 left-0 text-6xl animate-bounce" style={{ animationDelay: '1s' }}>🏏</div>
            
            {/* Floating Market Cap Pill */}
            {marketData && (
              <div className="absolute -bottom-6 right-10 lg:-right-4 bg-white text-orange-900 px-6 py-3 rounded-full border-4 border-orange-600 shadow-lg rotate-12 animate-pulse-slow z-20 hidden sm:block">
                <span className="font-bold text-sm block text-orange-600 uppercase tracking-widest">Market Cap</span>
                <span className="font-black text-xl">
                  {formatMcap(marketData.mcap)}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="bg-yellow-400 border-y-4 border-orange-800 py-3 overflow-hidden rotate-1 transform scale-105 z-20 relative shadow-lg">
        <div className="flex animate-scroll gap-8 whitespace-nowrap text-orange-900 font-black text-2xl font-comic">
          {[...Array(2)].map((_, i) => (
            <React.Fragment key={i}>
              <span>BONK!</span> <span>•</span>
              {marketData && (
                <>
                  <span className="text-green-700">MCAP: {formatMcap(marketData.mcap)}</span> <span>•</span>
                </>
              )}
              <span>CHEEMSBURBGER</span> <span>•</span>
              <span>NO HORNY JAIL</span> <span>•</span>
              <span>MUCH WOW</span> <span>•</span>
              <span>$CHEEMS</span> <span>•</span>
              <span>BONK!</span> <span>•</span>
              <span>CHEEMSBURBGER</span> <span>•</span>
              <span>NO HORNY JAIL</span> <span>•</span>
              <span>MUCH WOW</span> <span>•</span>
              <span>$CHEEMS</span> <span>•</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* About Lore */}
      <section id="about" className="py-24 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-md bg-orange-600/90 border-4 border-[#fbbf24] shadow-[8px_8px_0px_#c2410c] rounded-3xl p-8 md:p-16 text-center reveal">
            <h2 className="text-5xl md:text-6xl font-comic mb-8 text-white drop-shadow-lg">WHO IS CHEEMS?</h2>
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <p className="text-2xl font-bold text-white leading-relaxed">
                Cheems is an ironic Doge character popular for liking <strong>Cheemsburbgers</strong> and adding the letter 'M' into words.
              </p>
              <p className="text-2xl font-bold text-white leading-relaxed">
                While Swole Doge represents strength, Cheems represents our inner awkwardness. But don't be fooled... with his <strong>BONK</strong> bat, he sends all the jeets to horny jail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BONK PFP Generator */}
      <section id="generator" className="py-12 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-yellow-400 border-4 border-orange-900 shadow-[8px_8px_0px_#7c2d12] rounded-3xl p-8 md:p-12 text-center reveal">
            <div className="inline-block bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-black border-2 border-orange-900 mb-4">
              AI POWERED
            </div>
            <h2 className="text-5xl md:text-6xl font-comic mb-4 text-orange-900 drop-shadow-sm">GET BONKED!</h2>
            <p className="text-orange-900/80 font-bold text-xl mb-10 max-w-2xl mx-auto">
              Upload your PFP and let the AI bonk it! We'll flatten your head and add a *BONK* sign.
            </p>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Upload Side */}
              <div className="space-y-4">
                <div className="relative group">
                  <div className={`aspect-square rounded-2xl border-4 border-dashed border-orange-900/40 flex flex-col items-center justify-center bg-orange-100/50 overflow-hidden transition-all ${!uploadImage ? 'hover:bg-orange-100 hover:border-orange-900' : 'border-orange-900 border-solid bg-white'}`}>
                    {uploadImage ? (
                      <img src={uploadImage} alt="Upload" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-6">
                        <Upload className="w-12 h-12 text-orange-900/40 mx-auto mb-2" />
                        <p className="text-orange-900/60 font-bold">Click to upload your PFP</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>
                </div>
                
                <button 
                  onClick={generateBonkPfp}
                  disabled={!uploadImage || isGenerating}
                  className={`w-full py-4 rounded-xl border-4 border-orange-900 shadow-[4px_4px_0px_#7c2d12] font-comic text-2xl flex items-center justify-center gap-2 transition-all ${
                    !uploadImage || isGenerating 
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed shadow-none translate-y-1' 
                    : 'bg-orange-600 text-white hover:-translate-y-1 hover:shadow-[6px_6px_0px_#7c2d12] active:translate-y-0.5 active:shadow-[2px_2px_0px_#7c2d12]'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      BONKING...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-6 h-6" />
                      BONK ME!
                    </>
                  )}
                </button>
              </div>

              {/* Result Side */}
              <div className="aspect-square rounded-2xl border-4 border-orange-900 bg-white relative overflow-hidden shadow-inner flex items-center justify-center">
                {generatedImage ? (
                  <img src={generatedImage} alt="Bonked Result" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center opacity-30 p-8">
                     <p className="text-6xl mb-4">🏏</p>
                     <p className="font-comic text-2xl text-orange-900">RESULT WILL APPEAR HERE</p>
                  </div>
                )}
                
                {generatedImage && (
                  <a 
                    href={generatedImage} 
                    download="bonked-pfp.png"
                    className="absolute bottom-4 right-4 bg-green-500 text-white p-3 rounded-xl border-4 border-green-700 shadow-[3px_3px_0px_#14532d] hover:-translate-y-1 transition-transform"
                    title="Download Image"
                  >
                    <Download className="w-6 h-6" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <StatCard icon="🍔" title="1 BILLION" subtitle="Total Supply" delay="0s" />
            <StatCard icon="🔥" title="LIQUIDITY" subtitle="Burnt Forever" delay="0.1s" />
            <StatCard icon="🏏" title="0% TAX" subtitle="No Taxes" delay="0.2s" />
          </div>
        </div>
      </section>

      {/* Chart */}
      <section id="chart" className="py-24 px-4">
        <div className="max-w-7xl mx-auto reveal">
          <h2 className="text-5xl font-comic text-center mb-12 drop-shadow-md">LIVE CHART</h2>
          <div className="relative w-full pb-[125%] xl:pb-[65%] border-4 border-[#fbbf24] rounded-2xl shadow-[8px_8px_0px_#c2410c] overflow-hidden bg-black">
             <iframe 
                src="https://dexscreener.com/solana/CYQSFvU21fnS2YYzNrDQX2PrttHygo6nnZcmikY18CP7?embed=1&loadChartSettings=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15"
                className="absolute w-full h-full top-0 left-0 border-0"
                title="Cheems Chart"
             ></iframe>
          </div>
        </div>
      </section>

      {/* How To Buy */}
      <section id="how-to" className="py-24 px-4 bg-orange-800 text-white border-t-4 border-orange-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-comic text-center mb-16 text-yellow-400">HOW TO CHEEMS</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <StepCard number="1" title="GET PHANTOM" description="Download Phantom wallet and put some SOL in it. Easy peasy." />
            <StepCard number="2" title="GO TO DEX" description="Head to bonk.fun or Raydium." />
            <StepCard number="3" title="SWAP SOL" description={`Paste the CA: ${CA.slice(0, 4)}...bonk and swap SOL for $CHEEMS.`} />
            <StepCard number="4" title="BONK!" description="You are now a Cheems holder. Welcome to the family." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-orange-900 text-orange-200 text-center border-t-4 border-orange-950">
        <div className="max-w-7xl mx-auto px-4">
          <img 
            src={IMAGE_URL} 
            className="w-16 h-16 rounded-full mx-auto mb-4 border-4 border-orange-500 object-cover" 
            alt="Cheems" 
          />
          <p className="font-bold text-xl mb-2">$CHEEMS</p>
          <p className="text-sm opacity-60">© 2025 Cheems Token. Just a meme coin. No financial advice. Bonk.</p>
        </div>
      </footer>
    </div>
  );
};

const StatCard: React.FC<{ icon: string; title: string; subtitle: string; delay: string }> = ({ icon, title, subtitle, delay }) => (
  <div 
    className="backdrop-blur-md bg-white/10 border-4 border-[#fbbf24] shadow-[8px_8px_0px_#c2410c] rounded-3xl p-8 reveal transition-transform hover:-translate-y-1 hover:bg-white/20"
    style={{ transitionDelay: delay }}
  >
    <div className="text-5xl mb-2">{icon}</div>
    <h3 className="text-4xl font-comic mb-2">{title}</h3>
    <p className="font-bold opacity-80">{subtitle}</p>
  </div>
);

const StepCard: React.FC<{ number: string; title: string; description: string }> = ({ number, title, description }) => (
  <div className="bg-orange-700 p-8 rounded-2xl border-4 border-orange-900 shadow-xl relative overflow-hidden transition-transform hover:-translate-y-1">
    <span className="text-6xl font-black text-orange-900/30 absolute top-4 left-4 select-none">{number}</span>
    <div className="relative z-10 pl-4">
      <h3 className="text-2xl font-black mb-4">{title}</h3>
      <p className="font-bold opacity-90">{description}</p>
    </div>
  </div>
);

export default App;