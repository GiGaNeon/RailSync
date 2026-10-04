/* ============================================================
   RailSync — Live Weather (Open-Meteo, no API key required)
   ============================================================ */

const WeatherModule = (() => {
  const cache = {};

  function codeInfo(code){
    if(code===0) return { icon:'☀️', desc:'Clear sky' };
    if([1,2].includes(code)) return { icon:'🌤️', desc:'Mostly clear' };
    if(code===3) return { icon:'⛅', desc:'Overcast' };
    if([45,48].includes(code)) return { icon:'🌫️', desc:'Fog' };
    if([51,53,55,56,57].includes(code)) return { icon:'🌦️', desc:'Drizzle' };
    if([61,63,65,66,67,80,81,82].includes(code)) return { icon:'🌧️', desc:'Rain' };
    if([71,73,75,77,85,86].includes(code)) return { icon:'🌨️', desc:'Snow' };
    if([95,96,99].includes(code)) return { icon:'⛈️', desc:'Thunderstorm' };
    return { icon:'⛅', desc:'Variable' };
  }

  async function fetchReal(lat, lon){
    const key = lat.toFixed(2)+','+lon.toFixed(2);
    if(cache[key]) return cache[key];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&timezone=Asia%2FKolkata`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('weather fetch failed');
    const data = await res.json();
    const out = {
      temp: Math.round(data.current.temperature_2m),
      humidity: Math.round(data.current.relative_humidity_2m),
      precip: data.current.precipitation,
      ...codeInfo(data.current.weather_code),
    };
    cache[key] = out;
    return out;
  }

  function lerp(a,b,f){ return a + (b-a)*f; }

  /**
   * Loads live weather for a train's current position and pushes it
   * into the DOM + updates the train's live snapshot (so ETAEngine
   * can factor real precipitation into the forecast).
   */
  async function loadForTrain(t, isStillCurrent){
    const from = RailSyncDB.STATION_COORDS[t.from];
    const to = RailSyncDB.STATION_COORDS[t.to];
    if(!from || !to) return; // no coords for this pair — keep simulated fallback

    const lat = lerp(from[0], to[0], t.live.progress);
    const lon = lerp(from[1], to[1], t.live.progress);
    try{
      const w = await fetchReal(lat, lon);
      if(!isStillCurrent()) return; // train changed while fetching

      t.live.weather = w.icon;
      t.live.weatherDesc = `${w.desc} · ${w.temp}°C`;
      t.live.humidity = w.humidity;
      t.live.rain = w.precip > 0 ? Math.round(w.precip * 10) : 0;

      const wxIcon = document.getElementById('wxIcon');
      const wxDesc = document.getElementById('wxDesc');
      const wxHum = document.getElementById('wxHum');
      const wxRain = document.getElementById('wxRain');
      if(wxIcon) wxIcon.textContent = w.icon;
      if(wxDesc) wxDesc.textContent = `${w.desc} · ${w.temp}°C`;
      if(wxHum){
        wxHum.textContent = w.humidity + '%';
        if(wxHum.nextElementSibling) wxHum.nextElementSibling.textContent = w.humidity>70?'Humid':w.humidity>40?'Moderate':'Dry';
      }
      if(wxRain){
        wxRain.textContent = w.precip>0 ? w.precip.toFixed(1)+' mm' : '0 mm';
        if(wxRain.nextElementSibling) wxRain.nextElementSibling.textContent = w.precip>0 ? 'Currently falling' : 'No precipitation';
      }
      document.dispatchEvent(new CustomEvent('railsync:weather-updated'));
    }catch(e){
      // network unavailable — simulated values already rendered as fallback
    }
  }

  return { loadForTrain };
})();
