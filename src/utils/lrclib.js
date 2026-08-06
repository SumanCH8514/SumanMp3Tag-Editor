/**
 * Multi-Server Lyrics & Metadata Utility with Robust Multi-Provider Pipeline
 * Metadata Providers: Apple iTunes Store API (Primary) ➔ LRCLIB Database (Fallback)
 * Lyrics Providers:
 * S1: LRCLIB (Direct Match ➔ Fuzzy Search Engine with Dual-Script Extraction)
 * S2: Lyrics.ovh API Engine (Plain Text Database)
 * S3: LrcSearch Engine (LRCLIB Title & Keyword Search Engine)
 * S4: Global Multi-Provider Search Engine (Backup)
 */

export const SERVERS = [
  { id: 'S1', name: 'LRCLIB', label: 'LRCLIB', desc: 'LRCLIB Engine (Dual Synced & Plain Script Extraction)' },
  { id: 'S2', name: 'LyricsOVH', label: 'LyricsOVH', desc: 'Lyrics.ovh Open Database Engine' },
  { id: 'S3', name: 'LrcSearch', label: 'LrcSearch', desc: 'LrcSearch Engine (LRCLIB Title & Keyword Search)' },
  { id: 'S4', name: 'Global', label: 'Global', desc: 'Global Multi-Provider Search Engine' }
];

export const cleanQueryString = (str) => {
  if (!str) return '';
  return str
    .replace(/\s*-\s*SumanOnline\.Com/gi, '')
    .replace(/\[(official|video|audio|lyric|hd|4k|mp3).*?\]/gi, '')
    .replace(/\((official|video|audio|lyric|hd|4k|mp3).*?\)/gi, '')
    .trim();
};

export const getValidCoverUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  
  if (url.includes('uploads/covers/') || url.includes('uploads/mp3/')) {
    const relativePath = url.substring(url.indexOf('uploads/'));
    let basePath = typeof window !== 'undefined' ? window.location.pathname : '/';
    if (basePath.toLowerCase().endsWith('/files') || basePath.toLowerCase().endsWith('/files/')) {
      basePath = basePath.replace(/\/files\/?$/i, '/');
    } else if (basePath.toLowerCase().endsWith('/batch') || basePath.toLowerCase().endsWith('/batch/')) {
      basePath = basePath.replace(/\/batch\/?$/i, '/');
    }
    if (!basePath.endsWith('/')) basePath += '/';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}${basePath}${relativePath}`;
  }
  return url;
};

export const getApiUrl = (endpoint) => {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
  
  let basePath = typeof window !== 'undefined' ? window.location.pathname : '/';
  if (basePath.toLowerCase().endsWith('/files') || basePath.toLowerCase().endsWith('/files/')) {
    basePath = basePath.replace(/\/files\/?$/i, '/');
  } else if (basePath.toLowerCase().endsWith('/batch') || basePath.toLowerCase().endsWith('/batch/')) {
    basePath = basePath.replace(/\/batch\/?$/i, '/');
  }
  if (!basePath.endsWith('/')) basePath += '/';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${basePath}${endpoint.replace(/^\//, '')}`;
};

export const fetchImageAsBase64 = async (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('data:')) return imageUrl;
  
  try {
    const cleanUrl = imageUrl.replace(/^https?:\/\//, '');
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=600&h=600&fit=cover&output=jpg`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(imageUrl);
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn("Proxy base64 conversion failed:", err);
  }
  return imageUrl;
};

export const fetchSongMetadata = async ({ title, artist, album, duration }) => {
  const sanitize = (str) => {
    if (!str) return '';
    return cleanQueryString(str)
      .replace(/@\S+/g, '')
      .replace(/Unknown (Artist|Album|Title)/gi, '')
      .replace(/SumanOnline\.Com/gi, '')
      .trim();
  };

  const cleanTitle = sanitize(title);
  const cleanArtist = sanitize(artist?.split(/[,&/]|ft\.|feat\./i)[0]);
  const cleanAlbum = sanitize(album);

  if (!cleanTitle && !cleanAlbum) {
    return { success: false, error: 'Song title or album is required to fetch details.' };
  }

  const queryStages = [
    [cleanAlbum, cleanTitle].filter(Boolean).join(' '),
    [cleanTitle, cleanArtist].filter(Boolean).join(' '),
    cleanTitle,
    cleanAlbum
  ].filter((q, idx, arr) => q && arr.indexOf(q) === idx);

  for (const queryStr of queryStages) {
    try {
      const r1 = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(queryStr)}&media=music&limit=10`);
      if (r1.ok) {
        const d1 = await r1.json();
        if (d1.results && d1.results.length > 0) {
          let best = d1.results[0];
          if (duration && duration > 0) {
            const validDurMs = Math.round(duration) * 1000;
            const withinTol = d1.results.filter(x => x.trackTimeMillis && Math.abs(x.trackTimeMillis - validDurMs) <= 25000);
            if (withinTol.length > 0) {
              withinTol.sort((a, b) => Math.abs(a.trackTimeMillis - validDurMs) - Math.abs(b.trackTimeMillis - validDurMs));
              best = withinTol[0];
            }
          }

          const coverUrl = best.artworkUrl100 ? best.artworkUrl100.replace('100x100bb', '600x600bb') : null;
          const coverBase64 = coverUrl ? await fetchImageAsBase64(coverUrl) : null;
          const yearStr = best.releaseDate ? new Date(best.releaseDate).getFullYear().toString() : '';
          const albumClean = best.collectionName ? best.collectionName.replace(/\s*-\s*(Single|EP)$/i, '') : '';

          return {
            success: true,
            title: best.trackName || cleanTitle,
            artist: best.artistName || '',
            album: albumClean,
            genre: best.primaryGenreName || '',
            year: yearStr,
            cover: coverBase64,
            source: 'Apple iTunes Music'
          };
        }
      }
    } catch (err) {
      console.warn(`iTunes query stage "${queryStr}" failed:`, err.message);
    }
  }

  try {
    const q2 = [cleanTitle, cleanArtist].filter(Boolean).join(' ') || cleanAlbum;
    if (q2) {
      const r2 = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q2)}`);
      if (r2.ok) {
        const results = await r2.json();
        if (Array.isArray(results) && results.length > 0) {
          let best = results[0];
          if (duration && duration > 0) {
            const validDur = Math.round(duration);
            const withinTol = results.filter(x => x.duration && Math.abs(x.duration - validDur) <= 15);
            if (withinTol.length > 0) {
              withinTol.sort((a, b) => Math.abs(a.duration - validDur) - Math.abs(b.duration - validDur));
              best = withinTol[0];
            }
          }

          return {
            success: true,
            title: best.trackName || best.name || cleanTitle,
            artist: best.artistName || '',
            album: best.albumName || '',
            genre: '',
            year: '',
            cover: null,
            source: 'LRCLIB Database'
          };
        }
      }
    }
  } catch (err) {
    console.warn('LRCLIB metadata search failed:', err.message);
  }

  return { success: false, error: `No album artwork found online for "${cleanTitle || cleanAlbum}".` };
};

export const fetchLyricsByServer = async ({ title, artist, album, duration, server = 'S1' }) => {
  const cleanTitle = cleanQueryString(title);
  const cleanArtist = cleanQueryString(artist?.split(/[,&/]|ft\.|feat\./i)[0]);
  const cleanAlbum = cleanQueryString(album);
  const validDuration = duration && duration > 0 ? Math.round(duration) : null;

  if (!cleanTitle) {
    return { success: false, error: 'Song title is required to fetch lyrics.' };
  }

  const processCandidateResults = (results, sourceName) => {
    const candidates = results.filter(x => (x.syncedLyrics && x.syncedLyrics.trim()) || (x.plainLyrics && x.plainLyrics.trim()));
    if (!candidates.length) return null;

    let durationCandidates = candidates;
    if (validDuration) {
      const TOLERANCE = 15;
      const withinTol = candidates.filter(x => x.duration && Math.abs(x.duration - validDuration) <= TOLERANCE);
      if (withinTol.length > 0) durationCandidates = withinTol;
    }

    const syncedCandidates = durationCandidates.filter(x => x.syncedLyrics && x.syncedLyrics.trim());
    const latinSynced = syncedCandidates.filter(x => !isNonLatinScript(x.syncedLyrics));
    const bestSyncedCandidate = latinSynced[0] || syncedCandidates[0] || null;

    const plainCandidates = durationCandidates.filter(x => x.plainLyrics && x.plainLyrics.trim());
    const latinPlain = plainCandidates.filter(x => !isNonLatinScript(x.plainLyrics));
    const bestPlainCandidate = latinPlain[0] || plainCandidates[0] || bestSyncedCandidate;

    const syncedText = bestSyncedCandidate?.syncedLyrics || '';
    let plainText = bestPlainCandidate?.plainLyrics || bestPlainCandidate?.syncedLyrics || bestSyncedCandidate?.plainLyrics || '';

    if (plainText && /\[\d{2}:\d{2}\.\d{2,3}\]/.test(plainText) && bestPlainCandidate?.plainLyrics) {
      plainText = bestPlainCandidate.plainLyrics;
    }

    return {
      success: true,
      syncedLyrics: syncedText,
      plainLyrics: plainText,
      syncedIsDevanagari: isNonLatinScript(syncedText),
      plainIsDevanagari: isNonLatinScript(plainText),
      instrumental: !!(bestSyncedCandidate?.instrumental || bestPlainCandidate?.instrumental),
      trackName: bestSyncedCandidate?.trackName || bestPlainCandidate?.trackName || cleanTitle,
      artistName: bestSyncedCandidate?.artistName || bestPlainCandidate?.artistName || cleanArtist,
      albumName: bestSyncedCandidate?.albumName || bestPlainCandidate?.albumName || cleanAlbum,
      duration: bestSyncedCandidate?.duration || bestPlainCandidate?.duration || validDuration,
      sourceName: sourceName
    };
  };

  const fetchers = {
    S1: async () => {
      try {
        const p1 = new URLSearchParams();
        p1.append('track_name', cleanTitle);
        if (cleanArtist) p1.append('artist_name', cleanArtist);
        if (cleanAlbum && cleanAlbum !== 'Unknown Album' && cleanAlbum !== 'SumanOnline.Com') {
          p1.append('album_name', cleanAlbum);
        }
        if (validDuration) p1.append('duration', validDuration);

        const r1 = await fetch(`https://lrclib.net/api/get?${p1.toString()}`);
        if (r1.ok) {
          const d1 = await r1.json();
          if (d1.plainLyrics || d1.syncedLyrics) {
            const text1 = d1.syncedLyrics || d1.plainLyrics || '';
            if (isNonLatinScript(text1)) {
              try {
                const qSearch = [cleanTitle, cleanArtist].filter(Boolean).join(' ');
                const rSearch = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(qSearch)}`);
                if (rSearch.ok) {
                  const resSearch = await rSearch.json();
                  const processed = processCandidateResults(resSearch, 'LRCLIB (Fuzzy Search)');
                  if (processed) return processed;
                }
              } catch (e) { }
            }

            return {
              success: true,
              syncedLyrics: d1.syncedLyrics || '',
              plainLyrics: d1.plainLyrics || d1.syncedLyrics || '',
              syncedIsDevanagari: isNonLatinScript(d1.syncedLyrics),
              plainIsDevanagari: isNonLatinScript(d1.plainLyrics || d1.syncedLyrics),
              instrumental: !!d1.instrumental,
              trackName: d1.trackName || d1.name,
              artistName: d1.artistName,
              albumName: d1.albumName,
              duration: d1.duration || validDuration,
              sourceName: 'LRCLIB (Direct Match)'
            };
          }
        }
      } catch (err) {
        console.warn('LRCLIB Stage 1 Direct Match skipped:', err.message);
      }

      try {
        const p2 = new URLSearchParams();
        p2.append('track_name', cleanTitle);
        if (cleanArtist) p2.append('artist_name', cleanArtist);
        if (validDuration) p2.append('duration', validDuration);

        const r2 = await fetch(`https://lrclib.net/api/get?${p2.toString()}`);
        if (r2.ok) {
          const d2 = await r2.json();
          if (d2.plainLyrics || d2.syncedLyrics) {
            const text2 = d2.syncedLyrics || d2.plainLyrics || '';
            if (isNonLatinScript(text2)) {
              try {
                const qSearch = [cleanTitle, cleanArtist].filter(Boolean).join(' ');
                const rSearch = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(qSearch)}`);
                if (rSearch.ok) {
                  const resSearch = await rSearch.json();
                  const processed = processCandidateResults(resSearch, 'LRCLIB (Fuzzy Search)');
                  if (processed) return processed;
                }
              } catch (e) { }
            }

            return {
              success: true,
              syncedLyrics: d2.syncedLyrics || '',
              plainLyrics: d2.plainLyrics || d2.syncedLyrics || '',
              syncedIsDevanagari: isNonLatinScript(d2.syncedLyrics),
              plainIsDevanagari: isNonLatinScript(d2.plainLyrics || d2.syncedLyrics),
              instrumental: !!d2.instrumental,
              trackName: d2.trackName || d2.name,
              artistName: d2.artistName,
              albumName: d2.albumName,
              duration: d2.duration || validDuration,
              sourceName: 'LRCLIB (Direct Match)'
            };
          }
        }
      } catch (err) {
        console.warn('LRCLIB Stage 2 Direct Match skipped:', err.message);
      }

      try {
        const q3 = [cleanTitle, cleanArtist].filter(Boolean).join(' ');
        const r3 = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q3)}`);
        if (r3.ok) {
          const res3 = await r3.json();
          const processed = processCandidateResults(res3, 'LRCLIB (Fuzzy Search)');
          if (processed) return processed;
        }
      } catch (err) {
        console.warn('LRCLIB Stage 3 Fuzzy Search skipped:', err.message);
      }

      try {
        const r4 = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle)}`);
        if (r4.ok) {
          const res4 = await r4.json();
          const processed = processCandidateResults(res4, 'LRCLIB (Fuzzy Title Search)');
          if (processed) return processed;
        }
      } catch (err) {
        console.warn('LRCLIB Stage 4 Title Search skipped:', err.message);
      }

      throw new Error('LRCLIB Direct & Fuzzy Search engines returned no matching lyrics.');
    },

    S2: async () => {
      const artistParam = cleanArtist || cleanTitle;
      const r = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artistParam)}/${encodeURIComponent(cleanTitle)}`);
      if (!r.ok) throw new Error('Lyrics.ovh request returned 404');
      const data = await r.json();
      if (!data.lyrics || !data.lyrics.trim()) throw new Error('Lyrics.ovh returned empty lyrics');
      return {
        success: true,
        plainLyrics: data.lyrics.trim(),
        syncedLyrics: null,
        syncedIsDevanagari: false,
        plainIsDevanagari: isNonLatinScript(data.lyrics),
        instrumental: false,
        trackName: cleanTitle,
        artistName: cleanArtist,
        albumName: cleanAlbum,
        duration: validDuration,
        sourceName: 'Lyrics.ovh Open Database'
      };
    },

    S3: async () => {
      const p = new URLSearchParams();
      p.append('track_name', cleanTitle);
      if (cleanArtist) p.append('artist_name', cleanArtist);

      const r = await fetch(`https://lrclib.net/api/search?${p.toString()}`);
      if (r.ok) {
        const results = await r.json();
        const processed = processCandidateResults(results, 'LrcSearch (LRCLIB Title Engine)');
        if (processed) return processed;
      }

      const r2 = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle)}`);
      if (r2.ok) {
        const results2 = await r2.json();
        const processed2 = processCandidateResults(results2, 'LrcSearch (LRCLIB Title Engine)');
        if (processed2) return processed2;
      }

      throw new Error('LrcSearch Title Engine returned no results.');
    },

    S4: async () => {
      const r = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}`);
      if (r.ok) {
        const results = await r.json();
        const processed = processCandidateResults(results, 'Global Search (LRCLIB)');
        if (processed) return processed;
      }

      const artistParam = cleanArtist || cleanTitle;
      const ovhRes = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artistParam)}/${encodeURIComponent(cleanTitle)}`);
      if (ovhRes.ok) {
        const ovhData = await ovhRes.json();
        if (ovhData.lyrics) {
          return {
            success: true,
            plainLyrics: ovhData.lyrics.trim(),
            syncedLyrics: null,
            syncedIsDevanagari: false,
            plainIsDevanagari: isNonLatinScript(ovhData.lyrics),
            instrumental: false,
            trackName: cleanTitle,
            artistName: cleanArtist,
            albumName: cleanAlbum,
            duration: validDuration,
            sourceName: 'Global Search (Lyrics.ovh)'
          };
        }
      }

      throw new Error('Global Multi-Provider Search returned no results.');
    }
  };

  try {
    const targetFetcher = fetchers[server] || fetchers.S1;
    const data = await targetFetcher();
    return { success: true, ...data };
  } catch (err) {
    console.warn(`Server ${server} failed: ${err.message}. Trying automatic fallback...`);

    const fallbackServers = ['S1', 'S2', 'S3', 'S4'].filter(s => s !== server);
    for (const fbKey of fallbackServers) {
      try {
        const data = await fetchers[fbKey]();
        return { success: true, ...data };
      } catch (fbErr) {
        console.warn(`Fallback server ${fbKey} failed: ${fbErr.message}`);
      }
    }

    return {
      success: false,
      error: `No lyrics found for "${cleanTitle}" across all available engines.`
    };
  }
};

export const fetchLyrics = (args) => fetchLyricsByServer(args);
