/* ============================================================
   RailSync — Dynamic ETA Forecast Engine
   Produces a predicted arrival time (not just "scheduled + delay")
   by weighing four live factors:
     1. Current delay (block-section reported)
     2. Downstream congestion (how busy the remaining section is)
     3. Weather impact (rain/fog slow running, clear helps recovery)
     4. Recoverable slack (timetable padding that can absorb delay)
   The result is a predicted ETA with a confidence score, so the
   UI can show *when the train will actually arrive*, not just a
   static delay figure.
   ============================================================ */

const ETAEngine = (() => {

  function parseTimeToMinutes(hhmm){
    const [h,m] = hhmm.split(':').map(Number);
    return h*60+m;
  }
  function minutesToClock(mins){
    mins = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(mins/60);
    const m = Math.round(mins%60);
    return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
  }

  /**
   * Forecast the arrival time for a train given its live snapshot.
   * @param {object} train - a train record from RailSyncDB
   * @returns {{etaClock:string, etaDeltaMin:number, confidence:number,
   *            factors:{delay:number,congestion:number,weather:number,slack:number}}}
   */
  function forecast(train){
    const L = train.live;
    const scheduledArr = parseTimeToMinutes(train.arr);

    // remaining distance factor: trains further along have less exposure
    // to new disruption, so weight congestion/weather by remaining progress.
    const remainingFrac = Math.max(0.02, 1 - L.progress);

    // congestion penalty: 0-88% congestion -> up to +14 min projected delay
    const congestionPenalty = (L.congestion/100) * 14 * remainingFrac;

    // weather penalty: rain/fog reduce safe running speed on open sections
    const weatherPenalty = (L.rain/100) * 9 * remainingFrac;

    // recoverable slack: timetables build in padding; well-run sections
    // (low congestion, favourable weather, decent speed) claw delay back.
    const speedRatio = Math.min(1, L.speed / train.maxSpeed);
    const recoverableSlack = speedRatio * (1 - L.congestion/100) * 12 * remainingFrac;

    const projectedDelay = Math.max(0, L.delayMin + congestionPenalty + weatherPenalty - recoverableSlack);

    const etaAbs = scheduledArr + projectedDelay;

    // confidence drops as the train has more remaining distance / more
    // volatile inputs (congestion, rain) still ahead of it.
    const volatility = (L.congestion/100)*0.5 + (L.rain/100)*0.3 + remainingFrac*0.2;
    const confidence = Math.round(Math.max(55, 98 - volatility*40));

    return {
      etaClock: minutesToClock(etaAbs),
      etaDeltaMin: Math.round(projectedDelay),
      confidence,
      factors: {
        delay: Math.round(L.delayMin),
        congestion: Math.round(congestionPenalty),
        weather: Math.round(weatherPenalty),
        slack: Math.round(recoverableSlack),
      },
    };
  }

  return { forecast, parseTimeToMinutes, minutesToClock };
})();
