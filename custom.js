document.addEventListener('DOMContentLoaded', function() {
  
  // Global variable to track video play order
  let videoPlayOrder = [];
  
  function detectVideoType(value) {
    const trimmed = value.trim();
    console.log('Detecting video type for:', trimmed);
    
    // First check for URL (more specific)
    if (trimmed.toLowerCase().startsWith('https://') || trimmed.toLowerCase().startsWith('http://')) {
      console.log('Detected as URL');
      return 'url';
    }
    
    // Then check for Vimeo ID (only numbers, no other characters)
    if (/^\d+$/.test(trimmed)) {
      console.log('Detected as Vimeo ID');
      return 'vimeo';
    }
    
    console.log('Could not detect video type');
    return 'unknown';
  }
  
  function createVimeoBackground(img, videoId, altTag, contextName) {
    const container = document.createElement('div');
    container.className = 'image-video-container video-loading';
    
    img.parentNode.insertBefore(container, img);
    container.appendChild(img);
    
    const vimeoDiv = document.createElement('div');
    vimeoDiv.className = 'vimeo-background';
    
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&muted=1&background=1&controls=0&title=0&byline=0&portrait=0`;
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.setAttribute('allowfullscreen', '');
    
    vimeoDiv.appendChild(iframe);
    container.insertBefore(vimeoDiv, img);
    
    // Determine if this should autoplay (first video only)
    const isFirstVideo = videoPlayOrder.length === 0;
    videoPlayOrder.push(altTag);
    
    iframe.addEventListener('load', function() {
      console.log(`${contextName}: Vimeo iframe loaded for alt tag: ${altTag}`);
      container.classList.remove('video-loading');
      container.classList.add('has-video');
      
      setTimeout(() => {
        if (isFirstVideo) {
          // First video: autoplay and show
          container.classList.add('loaded');
          console.log(`${contextName}: Vimeo video auto-loaded for: ${altTag}`);
        } else {
          // Subsequent videos: set up for interaction but don't show yet
          console.log(`${contextName}: Vimeo video ready for interaction: ${altTag}`);
          addVimeoControls(container, altTag, contextName);
        }
      }, 1000);
    });
    
    setTimeout(() => {
      if (container.classList.contains('video-loading')) {
        console.log(`${contextName}: Vimeo loading timeout for: ${altTag}`);
        container.classList.remove('video-loading');
        container.classList.add('has-video');
        
        if (isFirstVideo) {
          container.classList.add('loaded');
        } else {
          addVimeoControls(container, altTag, contextName);
        }
      }
    }, 8000);
  }
  
  function addVimeoControls(container, altTag, contextName) {
    let hoverTimeout;
    
    container.addEventListener('mouseenter', () => {
      console.log(`${contextName}: Mouse enter on Vimeo ${altTag}`);
      clearTimeout(hoverTimeout);
      container.classList.add('loaded');
    });
    
    container.addEventListener('mouseleave', () => {
      console.log(`${contextName}: Mouse leave on Vimeo ${altTag}`);
      hoverTimeout = setTimeout(() => {
        container.classList.remove('loaded');
      }, 300);
    });
    
    // Mobile touch support
    container.addEventListener('touchstart', (e) => {
      e.preventDefault();
      console.log(`${contextName}: Touch on Vimeo ${altTag}`);
      
      if (container.classList.contains('loaded')) {
        container.classList.remove('loaded');
      } else {
        container.classList.add('loaded');
      }
    }, { passive: false });
  }
  
  function createPlyrBackground(img, videoUrl, altTag, contextName) {
    console.log(`${contextName}: Starting Plyr creation for: ${altTag} with URL: ${videoUrl}`);
    
    const container = document.createElement('div');
    container.className = 'image-video-container video-loading';
    
    img.parentNode.insertBefore(container, img);
    container.appendChild(img);
    
    const plyrDiv = document.createElement('div');
    plyrDiv.className = 'plyr-background';
    
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    const source = document.createElement('source');
    source.src = videoUrl;
    source.type = 'video/mp4';
    
    video.appendChild(source);
    plyrDiv.appendChild(video);
    container.insertBefore(plyrDiv, img);
    
    console.log(`${contextName}: Plyr HTML structure created for: ${altTag}`);
    
    // Determine play order before initialization
    const isFirstVideo = videoPlayOrder.length === 0;
    videoPlayOrder.push(altTag);
    
    // Check if Plyr is available
    if (typeof Plyr === 'undefined') {
      console.error(`${contextName}: Plyr is not loaded! Using basic video fallback.`);
      
      video.addEventListener('loadeddata', () => {
        console.log(`${contextName}: Basic video loaded for: ${altTag}`);
        container.classList.remove('video-loading');
        container.classList.add('has-video');
        
        if (isFirstVideo) {
          video.play().then(() => {
            container.classList.add('loaded');
          }).catch(error => {
            console.log(`${contextName}: Basic video autoplay failed for ${altTag}:`, error);
            container.classList.remove('has-video');
          });
        } else {
          // Add hover/touch controls for subsequent videos
          addVideoControls(container, video, altTag, contextName);
        }
      });
      
      video.addEventListener('error', (error) => {
        console.log(`${contextName}: Basic video error for ${altTag}:`, error);
        container.classList.remove('video-loading', 'has-video');
      });
      
      return;
    }
    
    // Initialize Plyr
    try {
      const player = new Plyr(video, {
        controls: [],
        autoplay: false,
        muted: true,
        loop: { active: true },
        hideControls: true,
        clickToPlay: false,
        disableContextMenu: true
      });
      
      console.log(`${contextName}: Plyr player initialized for: ${altTag}`);
      
      player.on('ready', () => {
        console.log(`${contextName}: Plyr player ready for: ${altTag}`);
        container.classList.remove('video-loading');
        container.classList.add('has-video');
        
        if (isFirstVideo) {
          console.log(`${contextName}: Attempting autoplay for first video: ${altTag}`);
          player.play().then(() => {
            console.log(`${contextName}: Autoplay successful for: ${altTag}`);
            container.classList.add('loaded');
          }).catch(error => {
            console.log(`${contextName}: Autoplay failed for ${altTag}:`, error);
            container.classList.remove('has-video');
          });
        } else {
          console.log(`${contextName}: ${altTag} is video #${videoPlayOrder.length} - adding interaction controls`);
          addPlyrControls(container, player, altTag, contextName);
        }
      });
      
      player.on('playing', () => {
        console.log(`${contextName}: Plyr video actually playing for: ${altTag}`);
        if (!container.classList.contains('loaded')) {
          container.classList.add('loaded');
        }
      });
      
      player.on('pause', () => {
        console.log(`${contextName}: Plyr video paused for: ${altTag}`);
        // Only hide video for non-first videos when paused
        if (videoPlayOrder.indexOf(altTag) > 0) {
          container.classList.remove('loaded');
        }
      });
      
      player.on('ended', () => {
        console.log(`${contextName}: Plyr video ended for: ${altTag}`);
        player.restart();
      });
      
      player.on('error', (error) => {
        console.log(`${contextName}: Plyr video error for ${altTag}:`, error);
        container.classList.remove('video-loading', 'has-video', 'loaded');
      });
      
    } catch (error) {
      console.error(`${contextName}: Error initializing Plyr for ${altTag}:`, error);
      container.classList.remove('video-loading', 'has-video');
    }
    
    // Backup timeout
    setTimeout(() => {
      if (container.classList.contains('video-loading')) {
        console.log(`${contextName}: Plyr loading timeout for: ${altTag}`);
        container.classList.remove('video-loading');
        
        // If this was supposed to be the first video, make sure it shows
        if (isFirstVideo && container.classList.contains('has-video')) {
          container.classList.add('loaded');
        }
      }
    }, 10000);
  }
  
  function addVideoControls(container, video, altTag, contextName) {
    let hoverTimeout;
    
    container.addEventListener('mouseenter', () => {
      console.log(`${contextName}: Mouse enter on ${altTag}`);
      clearTimeout(hoverTimeout);
      
      if (video.paused) {
        video.play().then(() => {
          container.classList.add('loaded');
        }).catch(error => {
          console.log(`${contextName}: Hover play failed for ${altTag}:`, error);
        });
      } else {
        container.classList.add('loaded');
      }
    });
    
    container.addEventListener('mouseleave', () => {
      console.log(`${contextName}: Mouse leave on ${altTag}`);
      hoverTimeout = setTimeout(() => {
        if (!video.paused) {
          video.pause();
        }
        container.classList.remove('loaded');
      }, 300);
    });
    
    // Mobile touch support
    container.addEventListener('touchstart', (e) => {
      e.preventDefault();
      console.log(`${contextName}: Touch on ${altTag}`);
      
      if (video.paused) {
        video.play().then(() => {
          container.classList.add('loaded');
        }).catch(error => {
          console.log(`${contextName}: Touch play failed for ${altTag}:`, error);
        });
      } else {
        video.pause();
        container.classList.remove('loaded');
      }
    }, { passive: false });
  }
  
  function addPlyrControls(container, player, altTag, contextName) {
    let hoverTimeout;
    
    container.addEventListener('mouseenter', () => {
      console.log(`${contextName}: Mouse enter on ${altTag}`);
      clearTimeout(hoverTimeout);
      
      if (player.paused) {
        player.play().catch(error => {
          console.log(`${contextName}: Hover play failed for ${altTag}:`, error);
        });
      } else {
        // Video is playing, make sure it shows
        container.classList.add('loaded');
      }
    });
    
    container.addEventListener('mouseleave', () => {
      console.log(`${contextName}: Mouse leave on ${altTag}`);
      hoverTimeout = setTimeout(() => {
        if (!player.paused) {
          player.pause();
        }
        container.classList.remove('loaded');
      }, 300);
    });
    
    // Mobile touch support
    container.addEventListener('touchstart', (e) => {
      e.preventDefault();
      console.log(`${contextName}: Touch on ${altTag}`);
      
      if (player.paused) {
        player.play().catch(error => {
          console.log(`${contextName}: Touch play failed for ${altTag}:`, error);
        });
      } else {
        player.pause();
        container.classList.remove('loaded');
      }
    }, { passive: false });
  }
  
  function createVideoBackground(img, videoValue, altTag, contextName) {
    const videoType = detectVideoType(videoValue);
    
    if (videoType === 'vimeo') {
      console.log(`${contextName}: Creating Vimeo background for ID: ${videoValue}`);
      createVimeoBackground(img, videoValue, altTag, contextName);
    } else if (videoType === 'url') {
      console.log(`${contextName}: Creating Plyr background for URL: ${videoValue}`);
      createPlyrBackground(img, videoValue, altTag, contextName);
    } else {
      console.log(`${contextName}: Unknown video type for value: ${videoValue}`);
    }
  }

  function findVideoMappingsInContext(context) {
    let videoMappingsElement = 
      context.querySelector('[data-video-mappings]') ||
      context.querySelector('.video-mappings') ||
      context.querySelector('[data-video-data]');
    
    if (!videoMappingsElement && context !== document) {
      videoMappingsElement = document.querySelector('[data-video-mappings]');
    }
    
    return videoMappingsElement;
  }

  function processImagesWithVideoMappings(containerElement, videoMappingsText, contextName) {
    if (!videoMappingsText) {
      console.log(`${contextName}: No video mappings text provided`);
      return;
    }
    
    const videoMap = {};
    videoMappingsText.split(',').forEach(mapping => {
      const [altTag, videoValue] = mapping.split('|');
      if (altTag && videoValue) {
        videoMap[altTag.trim().toLowerCase()] = videoValue.trim();
      }
    });
    
    console.log(`${contextName} video mappings:`, videoMap);
    
    let images = [];
    
    // For individual project pages, only search within .image-grid elements
    if (contextName === 'Project Page') {
      const imageGrids = document.querySelectorAll('.image-grid');
      console.log(`${contextName}: Found ${imageGrids.length} .image-grid elements`);
      
      imageGrids.forEach((grid, gridIndex) => {
        const gridImages = grid.querySelectorAll('img');
        console.log(`${contextName}: Grid ${gridIndex} contains ${gridImages.length} images`);
        images.push(...gridImages);
      });
      
      console.log(`${contextName}: Total images in all .image-grid elements: ${images.length}`);
    } else {
      // For other contexts (like homepage project items), search normally
      images = containerElement.querySelectorAll('img');
      console.log(`${contextName}: Found ${images.length} images in container`);
      
      // If container is the collection wrapper, try looking in the actual content area
      if (images.length <= 1) {
        const contentArea = containerElement.querySelector('.w-dyn-item') || 
                           containerElement.querySelector('.project-content') ||
                           containerElement.querySelector('.collection-item') ||
                           containerElement;
        
        if (contentArea !== containerElement) {
          console.log(`${contextName}: Trying content area:`, contentArea);
          images = contentArea.querySelectorAll('img');
          console.log(`${contextName}: Found ${images.length} images in content area`);
        }
      }
    }
    
    // Log all found images with exclusion info
    console.log(`${contextName}: === ALL IMAGES FOUND ===`);
    images.forEach((img, index) => {
      const isRelatedThumb = img.classList.contains('related-thumb');
      const inImageGrid = img.closest('.image-grid') !== null;
      
      console.log(`${contextName}: Image ${index}:`, {
        alt: img.getAttribute('alt'),
        classes: img.className,
        isRelatedThumb: isRelatedThumb,
        inImageGrid: inImageGrid,
        willProcess: !isRelatedThumb && (contextName !== 'Project Page' || inImageGrid)
      });
    });
    console.log(`${contextName}: === END IMAGE LIST ===`);
    
    images.forEach((img, imgIndex) => {
      // Skip related thumbs
      if (img.classList.contains('related-thumb')) {
        console.log(`${contextName}, Image ${imgIndex}: Skipping .related-thumb`);
        return;
      }
      
      // On project pages, only process images within .image-grid
      if (contextName === 'Project Page' && !img.closest('.image-grid')) {
        console.log(`${contextName}, Image ${imgIndex}: Skipping - not in .image-grid`);
        return;
      }
      
      const altTag = img.getAttribute('alt');
      
      if (!altTag) {
        console.log(`${contextName}, Image ${imgIndex}: No alt tag found`);
        return;
      }
      
      const altLower = altTag.toLowerCase();
      console.log(`${contextName}, Image ${imgIndex}: Processing "${altTag}" (lowercase: "${altLower}")`);
      
      // Enhanced matching - check if alt tag contains any video keyword
      const matchedKey = Object.keys(videoMap).find(key => {
        const keyLower = key.toLowerCase();
        
        // Split alt tag into words to match individual keywords
        const altWords = altLower.split(/\s+/);
        const keyWords = keyLower.split(/\s+/);
        
        // Check if any key word appears in alt tag
        const hasKeyword = keyWords.some(keyWord => 
          altLower.includes(keyWord) || altWords.includes(keyWord)
        );
        
        // Also check reverse - if alt word appears in key
        const hasAltWord = altWords.some(altWord => 
          keyLower.includes(altWord)
        );
        
        console.log(`${contextName}: Checking "${altLower}" vs "${keyLower}"`);
        console.log(`${contextName}: Has keyword: ${hasKeyword}, Has alt word: ${hasAltWord}`);
        
        return hasKeyword || hasAltWord;
      });
      
      if (matchedKey) {
        const videoValue = videoMap[matchedKey];
        console.log(`${contextName}: ✅ MATCHED "${altTag}" with video key "${matchedKey}", Value: ${videoValue}`);
        createVideoBackground(img, videoValue, altTag, contextName);
      } else {
        console.log(`${contextName}: ❌ NO MATCH for alt tag "${altTag}" against keys:`, Object.keys(videoMap));
      }
    });
  }

  // SCENARIO 1: Homepage with .project-item elements
  const projectItems = document.querySelectorAll('.project-item');
  if (projectItems.length > 0) {
    console.log(`Found ${projectItems.length} project items on homepage`);
    
    projectItems.forEach((projectItem, index) => {
      const videoMappingsElement = findVideoMappingsInContext(projectItem);
      
      if (videoMappingsElement) {
        const videoMappingsText = videoMappingsElement.textContent.trim();
        processImagesWithVideoMappings(
          projectItem, 
          videoMappingsText, 
          `Project Item ${index + 1}`
        );
      } else {
        console.log(`Project Item ${index + 1}: No video mappings found`);
      }
    });
  }

  // SCENARIO 2: Individual project page
  const singleCollectionItem = document.querySelector('.w-dyn-item');
  if (singleCollectionItem && projectItems.length === 0) {
    console.log('Found single collection item (project page)');
    
    const videoMappingsElement = findVideoMappingsInContext(document);
    
    if (videoMappingsElement) {
      const videoMappingsText = videoMappingsElement.textContent.trim();
      processImagesWithVideoMappings(
        singleCollectionItem, 
        videoMappingsText, 
        'Project Page'
      );
    } else {
      console.log('Project Page: No video mappings found anywhere on page');
    }
  }

  // SCENARIO 3: Fallback
  if (projectItems.length === 0 && !singleCollectionItem) {
    console.log('No specific structure found, searching entire document');
    
    const videoMappingsElement = document.querySelector('[data-video-mappings]');
    if (videoMappingsElement) {
      const videoMappingsText = videoMappingsElement.textContent.trim();
      processImagesWithVideoMappings(
        document, 
        videoMappingsText, 
        'Document Wide'
      );
    }
  }
});
