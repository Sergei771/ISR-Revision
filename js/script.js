const sections = document.querySelectorAll('.section');
const navItems = document.querySelectorAll('.nav-item');
const subnavs = document.querySelectorAll('.subnav');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('main-content');
const toggleBtn = document.getElementById('toggle-btn');
const toggleIcon = document.getElementById('toggle-icon');
const searchInput = document.getElementById('search-input');
const searchResultsContainer = document.getElementById('search-results');
const resultsContainer = document.getElementById('results-container');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressPercentage = document.getElementById('progress-percentage');

let totalSections = 0;
let viewedSections = new Set();

// --- Navigation ---

function updateActiveNav(targetId) {
    navItems.forEach(item => {
        item.classList.remove('active'); // Remove active from all first
        const onclickAttr = item.getAttribute('onclick');
        let isTarget = false;
        let parentSubnavId = null;

        if (onclickAttr) {
            // Match section toggle directly
            const sectionMatch = onclickAttr.match(/toggleSection\(\s*'([^']+)'\s*\)/);
            if (sectionMatch && sectionMatch[1] === targetId) {
                isTarget = true;
                const parentSubnav = item.closest('.subnav');
                if (parentSubnav) {
                    parentSubnavId = parentSubnav.id;
                }
            } 
            
            // Check if the target section is within a subnav triggered by this item
            const subnavMatch = onclickAttr.match(/toggleSubnav\(\s*'([^']+)'\s*\)/);
            if (subnavMatch) {
                 const subnavId = subnavMatch[1];
                 const subnavElement = document.getElementById(subnavId);
                 // Check if the *currently active* section is a child of this subnav
                 if (subnavElement && subnavElement.querySelector(`.nav-item[onclick*="toggleSection('${targetId}')"]`)) {
                      // Mark the parent subnav toggle as active
                      item.classList.add('active'); 
                 }
            }
        }

        // Activate the specific nav item that was clicked
        if (isTarget) {
             item.classList.add('active');
             // If the item is inside a subnav, also mark the parent subnav toggle as active
             if (parentSubnavId) {
                 const parentNavItem = document.querySelector(`.nav-item[onclick*="toggleSubnav('${parentSubnavId}')"]`);
                 if (parentNavItem) parentNavItem.classList.add('active');
             }
        }
    });
     // Special case for home (might need adjustment depending on final structure)
     if (targetId === 'home') {
         const homeNavItem = document.querySelector(".nav-item[onclick*=\"toggleSection('home')\"]");
         if (homeNavItem) homeNavItem.classList.add('active');
     }
}

function toggleSection(sectionId) {
    // console.log("[toggleSection] Toggling section:", sectionId); // Removing log
    
    // Récupérer toutes les sections à chaque appel plutôt que d'utiliser la variable globale
    const allSections = document.querySelectorAll('.section');
    let foundSection = false;
    
    allSections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.add('active');
            if (sectionId !== 'home') { // Don't track 'home' for progress initially
                viewedSections.add(sectionId);
            }
            updateProgress();
            foundSection = true;
        } else {
            section.classList.remove('active');
        }
    });

    // Si la section n'est toujours pas trouvée, essayons de la chercher directement par ID
    if (!foundSection) {
        // console.log(`Section not found in initial query, trying direct ID lookup: ${sectionId}`); // Removing log
        const directSection = document.getElementById(sectionId);
        if (directSection && directSection.classList.contains('section')) {
            // Masquer toutes les autres sections
            allSections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Afficher celle-ci
            directSection.classList.add('active');
            
            if (sectionId !== 'home') {
                viewedSections.add(sectionId);
            }
            updateProgress();
            foundSection = true;
        } else {
            // console.error(`Section with ID '${sectionId}' not found.`); // Removing log
            return; // Stop if section doesn't exist
        }
    }

    updateActiveNav(sectionId);

    // Hide search results when navigating
    if (searchResultsContainer) searchResultsContainer.style.display = 'none';

    // Scroll to top of main content area
     if (mainContent) {
         mainContent.scrollTop = 0; 
     } else {
         window.scrollTo(0, 0); // Fallback to window scroll if main-content doesn't exist
     }

    // Close sidebar on mobile after section selection
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('sidebar-collapsed')) {
        // console.log("[toggleSection] Sidebar is visible on mobile. Calling toggleSidebar() to CLOSE."); // Removing log
        toggleSidebar();
    }

    // Scroll vers la section sur mobile
    if (window.innerWidth <= 768) {
        scrollToActiveElement();
    }
}

function toggleSubnav(subnavId) {
    const subnav = document.getElementById(subnavId);
    const parentNavItem = document.querySelector(`.nav-item[onclick*="'${subnavId}'"]`);
    const icon = parentNavItem ? parentNavItem.querySelector('.fa-chevron-down, .fa-chevron-right') : null;

    if (subnav && parentNavItem) {
        // console.log(`[toggleSubnav ${subnavId}] Current state: open=${subnav.classList.contains('open')}, parentActive=${parentNavItem.classList.contains('active')}`);
        
        const isOpen = !subnav.classList.contains('open'); // Determine the NEW state

        if (isOpen) {
            // --- OPENING --- 
            // 1. Ensure it's display: block so scrollHeight can be calculated
            subnav.style.display = 'block'; 
            
            // 2. Add the class AFTER setting display block
            subnav.classList.add('open');
            
            // 3. Set maxHeight using scrollHeight
            //    Requesting animation frame might help ensure calculation is ready
            requestAnimationFrame(() => {
                 subnav.style.maxHeight = subnav.scrollHeight + "px";
            });
           
            // console.log(`[toggleSubnav ${subnavId}] OPENING. Set display: block, maxHeight calculated to: ${subnav.scrollHeight}px (async)`);
            parentNavItem.classList.add('active');

        } else {
            // --- CLOSING --- 
             // 1. Set maxHeight to 0 to trigger transition
            subnav.style.maxHeight = "0";
            
             // 2. Remove the open class
            subnav.classList.remove('open');
            
            // --- Logic to remove parent active state (unchanged from previous attempt) --- 
            const currentActiveSection = document.querySelector('.section.active');
            let isChildActive = false;
            if (currentActiveSection) {
                const activeChildNavItem = subnav.querySelector(`.nav-item[onclick*="toggleSection('${currentActiveSection.id}')"]`);
                if (activeChildNavItem) {
                    isChildActive = true;
                }
            }
            // console.log(`[toggleSubnav ${subnavId}] Is a child section active within this subnav? ${isChildActive}`);
            if (!isChildActive) {
                 // console.log(`[toggleSubnav ${subnavId}] No active child section found. Removing .active from parent.`);
                 parentNavItem.classList.remove('active');
            } else {
                 // console.log(`[toggleSubnav ${subnavId}] Active child section found. Keeping parent .active.`);
            }
            // --- End of parent active state logic ---
        }

        // --- Toggle icon (simplified) --- 
        if (icon) {
             icon.classList.toggle('fa-chevron-down', isOpen);
             icon.classList.toggle('fa-chevron-right', !isOpen);
            // Reset transform, let CSS handle rotation via classes if needed later
             icon.style.transform = 'rotate(0deg)'; 
            // console.log(`[toggleSubnav ${subnavId}] Updated icon classes: ${icon.className}`);
        }
        // console.log(`[toggleSubnav ${subnavId}] Final state: open=${subnav.classList.contains('open')}, parentActive=${parentNavItem.classList.contains('active')}`);

    } else {
        // Error logging
    }
}

// Add smooth transition CSS for subnav maxHeight (if not already in style.css)
function addSubnavTransitionCSS() {
    if (!document.getElementById('subnav-transition-style')) {
        const styleSheet = document.createElement("style");
        styleSheet.id = 'subnav-transition-style';
        styleSheet.innerText = `
            .subnav {
                overflow: hidden;
                max-height: 0;
                transition: max-height 0.3s ease-out, padding 0.3s ease-out;
                 display: block; /* Keep it block for transition logic, visibility is controlled by open class */
                 padding-left: 20px; /* Default padding */
            }
             .subnav.open {
                /* maxHeight will be set dynamically */
                display: block;
            }
            .subnav:not(.open) {
                padding-top: 0;
                padding-bottom: 0;
                margin-top: 0;
                margin-bottom: 0;
            }
            .nav-item .fa-chevron-right {
                 transition: transform 0.3s ease-out;
            }
        `;
        document.head.appendChild(styleSheet);
    }
}

// Helper function to update icon based on current state and screen size
function updateSidebarIcon() {
    if (!sidebar || !toggleIcon) return;

    const isCollapsed = sidebar.classList.contains('sidebar-collapsed');
    const isMobile = window.innerWidth <= 768;

    let isVisuallyHidden;
    if (isMobile) {
        // On mobile, hidden means NO 'sidebar-collapsed' class
        isVisuallyHidden = !isCollapsed;
    } else {
        // On desktop, hidden means 'sidebar-collapsed' class IS present
        isVisuallyHidden = isCollapsed;
    }

    // Set icon based on visual state
    if (isVisuallyHidden) {
        // Show hamburger when hidden
        toggleIcon.classList.remove('fa-times');
        toggleIcon.classList.add('fa-bars');
    } else {
        // Show cross when visible
        toggleIcon.classList.remove('fa-bars');
        toggleIcon.classList.add('fa-times');
    }
}

// --- Sidebar Toggle ---

function toggleSidebar() {
    if (!sidebar || !mainContent || !toggleIcon) {
        // console.warn("Sidebar elements not found."); // Removing log
        return;
    }
    
    // Toggle the class that controls visibility
    sidebar.classList.toggle('sidebar-collapsed');
    
    // Toggle main content margin ONLY on desktop (mobile CSS handles it)
    if (window.innerWidth > 768) {
        mainContent.classList.toggle('main-content-expanded');
    }
    
    // Update the icon based on the new state
    updateSidebarIcon();
}

function setupSidebarToggle() {
    const toggleBtn = document.getElementById('toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
             toggleSidebar();
        });
    } else {
        // console.error("Toggle button (#toggle-btn) NOT found!"); // Removing log
    }
}

function checkSidebarState() {
    if (!sidebar || !mainContent || !toggleIcon) {
        return;
    }
    
    const isMobile = window.innerWidth <= 768;
    let shouldBeInitiallyHidden;

    if (isMobile) {
        shouldBeInitiallyHidden = true; // Mobile starts hidden
    } else {
        shouldBeInitiallyHidden = localStorage.getItem('sidebarCollapsed') === 'true'; 
    }

    // Set the correct class based on initial state
    if (shouldBeInitiallyHidden) {
        if (isMobile) {
            // Hidden on mobile means REMOVING the class
            sidebar.classList.remove('sidebar-collapsed');
        } else {
            // Hidden on desktop means ADDING the class
            sidebar.classList.add('sidebar-collapsed'); 
             mainContent.classList.add('main-content-expanded');
        }
    } else { // Should be initially visible
        if (isMobile) {
             // Visible on mobile means ADDING the class
            sidebar.classList.add('sidebar-collapsed');
        } else {
             // Visible on desktop means REMOVING the class
            sidebar.classList.remove('sidebar-collapsed'); 
            mainContent.classList.remove('main-content-expanded');
        }
    }
    
    // Ensure the body click listener is only added once or managed correctly
    // Remove potentially existing listener before adding
    document.body.removeEventListener('click', handleBodyClickForSidebar);
    if (isMobile) {
        document.body.addEventListener('click', handleBodyClickForSidebar);
    }
}

// Separate handler for body click to make removal easier if needed
function handleBodyClickForSidebar(e) {
     // console.log("[Body Click] Detected. Target:", e.target); // Removing log
     const isOutside = !sidebar.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target)); // Ensure toggleBtn exists
     const isVisibleMobile = sidebar && sidebar.classList.contains('sidebar-collapsed'); // Ensure sidebar exists
     // console.log(`[Body Click] Is Outside: ${isOutside}, Is Visible (Mobile): ${isVisibleMobile}`); // Removing log

     if (isOutside && isVisibleMobile) {
         // console.log("[Body Click] Conditions met. Calling toggleSidebar() to CLOSE."); // Removing log
         toggleSidebar();
     } else {
         // console.log("[Body Click] Conditions not met. No action."); // Removing log
     }
}

// Fonctions supplémentaires pour l'expérience mobile

// Fonction pour scroller doucement vers l'élément actif
function scrollToActiveElement() {
    const activeElement = document.querySelector('.section.active');
    if (activeElement) {
        setTimeout(() => {
            activeElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 300);
    }
}

// --- Search ---

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\\\]]/g, '\\$&'); // $& means the whole matched string
}

function searchContent() {
     if (!searchInput || !resultsContainer || !searchResultsContainer) {
        // console.warn("Search elements not found."); // Removing log
        return;
     } 

    const searchTerm = searchInput.value.trim().toLowerCase();
    resultsContainer.innerHTML = ''; // Clear previous results
    searchResultsContainer.style.display = 'none';

    if (searchTerm.length < 3) {
        if (searchTerm.length > 0) {
             resultsContainer.innerHTML = '<p class="text-gray-400">Veuillez entrer au moins 3 caractères.</p>';
             searchResultsContainer.style.display = 'block';
        }
        return;
    }

    let foundResults = false;
    const regex = new RegExp(escapeRegExp(searchTerm), 'gi'); // 'g' for global, 'i' for case-insensitive

    sections.forEach(section => {
        if (!section.id || section.id === 'home') return; // Skip home or sections without ID

        const sectionTitleElement = section.querySelector('.section-title');
        const subsectionTitleElements = section.querySelectorAll('.subsection-title');
        // More comprehensive content search
        const contentElements = section.querySelectorAll('p, li, h3, h4, td, th, .concept-card, .info-box, .warning-box, .important-box, .step-box, .glossary-term');

        let sectionMatches = [];
        const sectionId = section.id;
        const sectionHeaderText = sectionTitleElement ? sectionTitleElement.innerText.replace(sectionTitleElement.querySelector('i')?.innerText || '', '').trim() : `Section ${sectionId}`;

        function addMatch(element, type, context = null, highlightTarget = null) {
             const textContent = element.innerText || element.textContent;
             if (textContent.toLowerCase().includes(searchTerm)) {
                // Avoid duplicate matches for the same element in this section
                if (!sectionMatches.some(m => m.element === element)) {
                    sectionMatches.push({ 
                        element: highlightTarget || element, // Element to scroll/highlight
                        type: type, 
                        sectionId: sectionId, 
                        context: context || textContent // Text to display
                    });
                    foundResults = true;
                }
                return true;
             }
             return false;
        }

        // Search section title
        if (sectionTitleElement) addMatch(sectionTitleElement, 'section', sectionHeaderText);

        // Search subsection titles
         subsectionTitleElements.forEach(subTitle => addMatch(subTitle, 'subsection', `${sectionHeaderText} > ${subTitle.innerText.trim()}` ));

        // Search content elements
        contentElements.forEach(el => {
             addMatch(el, 'content');
        });

        // Display results for this section
        if (sectionMatches.length > 0) {
            const sectionResultContainer = document.createElement('div');
            sectionResultContainer.classList.add('mb-4'); // Spacing between section results

            // Clickable section header
            const headerLink = document.createElement('h4');
            headerLink.className = 'font-bold text-lg mb-2 text-blue-400 cursor-pointer hover:underline';
            headerLink.textContent = sectionHeaderText;
            headerLink.onclick = () => toggleSection(sectionId);
            sectionResultContainer.appendChild(headerLink);

            sectionMatches.forEach(match => {
                const resultDiv = document.createElement('div');
                resultDiv.classList.add('search-result', 'mb-2', 'p-2', 'rounded', 'bg-gray-700', 'hover:bg-gray-600', 'cursor-pointer'); // Style results
                let previewText = match.context.trim();

                // Highlight the search term
                 // Use match.context for highlighting, not potentially truncated previewText
                const highlightedContext = previewText.replace(regex, `<span class="highlight bg-yellow-400 px-1 rounded">$&</span>`);

                // Create a snippet around the first match
                const maxLen = 180;
                const firstMatchIndex = highlightedContext.toLowerCase().indexOf(searchTerm.toLowerCase()); // Find index in original case for better positioning
                let start = 0;
                let end = highlightedContext.length;

                 if (highlightedContext.length > maxLen && firstMatchIndex !== -1) {
                     start = Math.max(0, firstMatchIndex - Math.floor(maxLen / 3));
                     // Find the beginning of the word for the start
                     while(start > 0 && highlightedContext[start-1] !== ' ') start--; 
                     
                     end = Math.min(highlightedContext.length, start + maxLen);
                     // Find the end of the word for the end
                     while(end < highlightedContext.length && highlightedContext[end] !== ' ') end++;
                 }

                 const snippet = (start > 0 ? '... ' : '') + highlightedContext.substring(start, end) + (end < highlightedContext.length ? ' ...' : '');

                resultDiv.innerHTML = `<p class="text-sm">${snippet}</p>`;
                resultDiv.onclick = () => {
                    toggleSection(match.sectionId);
                    // Scroll to the matched element after section toggles
                    setTimeout(() => {
                        // Ensure the element exists before scrolling
                         if (match.element && document.body.contains(match.element)) {
                            match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Optional: Highlight the specific element briefly
                            const originalBg = match.element.style.backgroundColor;
                            match.element.style.backgroundColor = 'rgba(96, 165, 250, 0.3)'; // Light blue highlight
                             match.element.style.transition = 'background-color 0.3s ease-in-out';
                            setTimeout(() => { 
                                match.element.style.backgroundColor = originalBg;
                                // Clean up transition style
                                setTimeout(() => { match.element.style.transition = ''; }, 300);
                            }, 2000);
                         } else {
                            // console.warn("Target element for search result no longer exists or is not visible."); // Removing log
                         }
                    }, 200); // Increased Delay to allow section rendering
                };
                sectionResultContainer.appendChild(resultDiv);
            });
            resultsContainer.appendChild(sectionResultContainer);
        }
    });

    if (!foundResults) {
        resultsContainer.innerHTML = `<p class="text-gray-400">Aucun résultat trouvé pour "${searchTerm}".</p>`;
    }
     searchResultsContainer.style.display = 'block';
}

function setupSearch() {
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent form submission if it were in a form
                searchContent();
            }
        });
        // Optional: Add a search button listener if you have one
        // const searchButton = document.getElementById('search-button'); // Assuming a button exists
        // if (searchButton) {
        //     searchButton.addEventListener('click', searchContent);
        // }
    }
}


// --- Quiz ---

function setupQuizzes() {
    document.querySelectorAll('.quiz-container').forEach((quizContainer, quizIndex) => {
        const questions = Array.from(quizContainer.querySelectorAll('.quiz-question'));
        const optionsContainers = Array.from(quizContainer.querySelectorAll('.quiz-options'));
        const feedbacks = Array.from(quizContainer.querySelectorAll('.quiz-feedback'));
        const prevButton = quizContainer.querySelector('.quiz-prev');
        const nextButton = quizContainer.querySelector('.quiz-next');
        const finishButton = quizContainer.querySelector('.quiz-finish');
        const resultsDiv = quizContainer.querySelector('.quiz-results');
        const scoreSpan = quizContainer.querySelector('.quiz-score');
        const totalSpan = quizContainer.querySelector('.quiz-total');
        const navigationDiv = quizContainer.querySelector('.quiz-navigation');

        // Basic validation for essential elements
        if (!navigationDiv || !prevButton || !nextButton || !finishButton || !resultsDiv || !scoreSpan || !totalSpan || questions.length === 0 || questions.length !== optionsContainers.length || questions.length !== feedbacks.length) {
            // console.error(`Quiz structure invalid in container ${quizIndex}. Skipping setup.`, quizContainer); // Removing log
            // Optionally hide the broken quiz container
            // quizContainer.style.display = 'none'; 
            return; 
        }

        let currentQuestionIndex = 0;
        let score = 0;
        const totalQuestions = questions.length;
        // Store answers as { selectedIndex: number | null, correct: boolean | null }
        let answerState = new Array(totalQuestions).fill(null).map(() => ({ selectedIndex: null, correct: null })); 

        totalSpan.textContent = totalQuestions;
        scoreSpan.textContent = score;

        function showQuestion(index) {
            questions.forEach((q, i) => q.style.display = i === index ? 'block' : 'none');
            optionsContainers.forEach((o, i) => {
                o.style.display = i === index ? 'grid' : 'none'; // Use grid for layout
                if (i === index) {
                    const options = o.querySelectorAll('.quiz-option');
                    options.forEach((opt, optIndex) => {
                        opt.classList.remove('selected', 'correct', 'incorrect');
                        opt.style.pointerEvents = 'auto'; // Re-enable clicks

                        // Restore visual state if question was answered
                        if (answerState[index].selectedIndex !== null) {
                            opt.style.pointerEvents = 'none'; // Disable clicks if answered
                            if (optIndex === answerState[index].selectedIndex) {
                                opt.classList.add('selected');
                                if (answerState[index].correct) {
                                    opt.classList.add('correct');
                                } else {
                                    opt.classList.add('incorrect');
                                }
                            } else if (opt.dataset.correct === 'true') {
                                // Highlight correct answer even if not selected
                                opt.classList.add('correct');
                            }
                        }
                    });
                }
            });
            feedbacks.forEach((f, i) => {
                if (i === index && answerState[index].selectedIndex !== null) {
                    f.textContent = answerState[index].correct ? "Bonne réponse !" : "Incorrect. La bonne réponse est mise en évidence.";
                    f.className = `quiz-feedback ${answerState[index].correct ? 'correct text-green-400' : 'incorrect text-red-400'}`;
                    f.style.display = 'block';
                } else {
                    f.style.display = 'none';
                }
            });

            // Update button states
            prevButton.disabled = index === 0;
            nextButton.style.display = index === totalQuestions - 1 ? 'none' : 'inline-flex';
            finishButton.style.display = index === totalQuestions - 1 ? 'inline-flex' : 'none';
            resultsDiv.style.display = 'none'; // Hide results while navigating questions
            navigationDiv.style.display = 'flex'; // Ensure nav is visible
        }

        function handleOptionSelection(selectedOption, optionsContainer, feedback, questionIndex) {
             // Only allow answering once
             if (answerState[questionIndex].selectedIndex !== null) return;

            const options = optionsContainer.querySelectorAll('.quiz-option');
            const selectedIndex = Array.from(options).indexOf(selectedOption);
            const isCorrect = selectedOption.dataset.correct === 'true';

            // Update answer state
            answerState[questionIndex] = { selectedIndex: selectedIndex, correct: isCorrect };

            // Update score only if the answer is correct
            if (isCorrect) {
                score++;
            }
            scoreSpan.textContent = score;

            // Show feedback and update visuals for the current question
            showQuestion(questionIndex);
        }

        optionsContainers.forEach((container, index) => {
             const options = container.querySelectorAll('.quiz-option');
             options.forEach(option => {
                 option.addEventListener('click', () => handleOptionSelection(option, container, feedbacks[index], index));
             });
        });

        nextButton.addEventListener('click', () => {
            if (currentQuestionIndex < totalQuestions - 1) {
                currentQuestionIndex++;
                showQuestion(currentQuestionIndex);
            }
        });

        prevButton.addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                showQuestion(currentQuestionIndex);
            }
        });

        finishButton.addEventListener('click', () => {
            resultsDiv.style.display = 'block';
            scoreSpan.textContent = score;
            navigationDiv.style.display = 'none'; // Hide navigation
             // Hide question/options/feedback
             questions.forEach(q => q.style.display = 'none');
             optionsContainers.forEach(o => o.style.display = 'none');
             feedbacks.forEach(f => f.style.display = 'none');
        });

        // Initial display
        showQuestion(0);
    });
}

// --- Flashcards ---

function setupFlashcards() {
    document.querySelectorAll('.flashcard').forEach(card => {
         const inner = card.querySelector('.flashcard-inner');
         if (inner) { // Ensure the inner element exists
            card.addEventListener('click', () => {
                card.classList.toggle('flipped');
            });
        }
    });
}

 // --- Progress Tracking ---
 function calculateTotalSections() {
     totalSections = 0;
     const countedIds = new Set(); // Use a set to count unique section IDs only once
 
     navItems.forEach(item => {
         const onclickAttr = item.getAttribute('onclick');
         if (onclickAttr && onclickAttr.startsWith('toggleSection')) {
              const sectionIdMatch = onclickAttr.match(/toggleSection\(\s*'([^']+)'\s*\)/);
              if (sectionIdMatch && sectionIdMatch[1] && sectionIdMatch[1] !== 'home') {
                  // Check if the section element actually exists
                  if (document.getElementById(sectionIdMatch[1]) && !countedIds.has(sectionIdMatch[1])) {
                    totalSections++;
                    countedIds.add(sectionIdMatch[1]);
                  }
              }
         }
     });
      // Manually add hubs if they exist and aren't covered by nav items
      ['quiz-hub', 'flashcards-hub', 'glossary'].forEach(id => {
          if (document.getElementById(id) && !countedIds.has(id)) {
              totalSections++;
              countedIds.add(id);
          }
      });
 
     console.log("Total trackable sections for progress:", totalSections, countedIds);
     if (totalSections === 0) {
         console.warn("Progress tracking: No trackable sections found! Progress bar might not work correctly.");
     }
     // Initialize progress after calculating total
     updateProgress(); 
 }
 
 
 function updateProgress() {
     if (!progressBarFill || !progressPercentage) {
        // console.warn("Progress bar elements not found."); // Removing log
        return; // Silently return if elements aren't there
     }
    if (totalSections === 0) {
         progressBarFill.style.width = `0%`;
         progressPercentage.textContent = `N/A`; // Indicate no sections to track
        return; // Avoid division by zero
    }

    // Filter out 'home' if it was added accidentally
    const actualViewed = new Set([...viewedSections].filter(id => id !== 'home'));
    const viewedCount = actualViewed.size;

    let percentage = Math.round((viewedCount / totalSections) * 100);
    percentage = Math.min(percentage, 100); // Cap at 100

    progressBarFill.style.width = `${percentage}%`;
    progressPercentage.textContent = `${percentage}%`;
     // console.log("Viewed sections (tracked):", actualViewed); // Removing log
     // console.log("Progress:", percentage); // Removing log
}

// --- Quick Revision Mode (Placeholder) ---
// function setupQuickRevision() {
//     const quickRevisionToggleBtn = document.getElementById('quick-revision-btn');
//     if (quickRevisionToggleBtn) {
//         quickRevisionToggleBtn.addEventListener('click', () => {
//             document.body.classList.toggle('quick-revision-mode');
//             quickRevisionToggleBtn.textContent = document.body.classList.contains('quick-revision-mode') ? 'Mode Normal' : 'Révision Rapide';
//         });
//     }
// }

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // Check for essential elements before proceeding
    if (!document.body || !document.head) {
        // console.error("DOM not fully loaded or basic elements missing."); // Removing log
        return;
    }

    addSubnavTransitionCSS();
    setupSidebarToggle();
    setupSearch();
    setupQuizzes();
    setupFlashcards();
    setupQuizHub();
    setupFlashcardsHub();
    setupMobileNavigation(); // Ajout de la barre de navigation mobile
    // setupQuickRevision(); // Uncomment if you implement this feature
    
    calculateTotalSections(); // Calculate total sections first
    
    // Determine initial section (e.g., 'home' or first available)
    let initialSectionId = 'home';
    if (!document.getElementById(initialSectionId)) {
        const firstNavSection = document.querySelector('.nav-item[onclick*="toggleSection"]');
        if(firstNavSection) {
            const match = firstNavSection.getAttribute('onclick').match(/toggleSection\(\s*'([^']+)'\s*\)/);
            if (match && match[1]) {
                initialSectionId = match[1];
            }
        }
    }
    
    // Show initial section without affecting progress
    toggleSection(initialSectionId); 
    if (initialSectionId !== 'home') {
        // If initial section wasn't home, ensure it's added if we want to track it immediately
        // viewedSections.add(initialSectionId); 
    } else {
       viewedSections.delete('home'); // Ensure home doesn't count initially
    }
    updateProgress(); // Update progress after potential section view
    
    checkSidebarState(); // Set initial sidebar class state
    updateSidebarIcon(); // Set initial icon state *after* checkSidebarState

    // Open the subnav containing the initially active section, if any
    const activeNavItem = document.querySelector('.nav-item.active');
    const parentSubnav = activeNavItem ? activeNavItem.closest('.subnav') : null;
    if (parentSubnav && parentSubnav.id) {
        // Ensure the subnav is visually open
         const parentNavToggle = document.querySelector(`.nav-item[onclick*="toggleSubnav('${parentSubnav.id}')"]`);
         if (parentNavToggle && !parentSubnav.classList.contains('open')) {
            toggleSubnav(parentSubnav.id);
         }
    }
});

// Fonction de recherche pour le glossaire
function filterGlossary() {
    const searchTerm = document.getElementById('glossary-search').value.toLowerCase();
    const items = document.querySelectorAll('.glossary-item');
    let anyVisible = false;
    
    items.forEach(item => {
        const term = item.querySelector('.glossary-term').textContent.toLowerCase();
        const definition = item.querySelector('.glossary-definition').textContent.toLowerCase();
        
        if (term.includes(searchTerm) || definition.includes(searchTerm)) {
            item.style.display = 'block';
            anyVisible = true;
            
            // Make parent section visible
            const parentSection = item.closest('.glossary-section');
            parentSection.style.display = 'block';
         } else {
            item.style.display = 'none';
         }
     });
    
    // If no items match the search, show a message
    const noResults = document.getElementById('no-results');
    if (noResults) {
        noResults.style.display = anyVisible ? 'none' : 'block';
    }
    
    // Hide sections with no visible items
    const sections = document.querySelectorAll('.glossary-section');
    sections.forEach(section => {
        const visibleItems = section.querySelectorAll('.glossary-item[style="display: block;"]');
        if (visibleItems.length === 0 && searchTerm !== '') {
            section.style.display = 'none';
        } else if (searchTerm === '') {
            section.style.display = 'block';
        }
    });
}

// Fonction pour créer et gérer la barre de navigation mobile
function setupMobileNavigation() {
    // Vérifier si la barre de navigation existe déjà
    let mobileNav = document.getElementById('mobile-bottom-nav');
    
    // Si elle n'existe pas, la créer
    if (!mobileNav) {
        mobileNav = document.createElement('div');
        mobileNav.className = 'bottom-nav';
        mobileNav.id = 'mobile-bottom-nav';
        
        // Contenu de la barre de navigation
        mobileNav.innerHTML = `
            <button class="btn" onclick="toggleSection('home')">
                <i class="fas fa-home"></i>
                <span>Accueil</span>
            </button>
            <button class="btn" onclick="toggleSection('glossary')">
                <i class="fas fa-book"></i>
                <span>Glossaire</span>
            </button>
            <button class="btn" onclick="toggleSection('quiz-hub')">
                <i class="fas fa-question-circle"></i>
                <span>Quiz</span>
            </button>
            <button class="btn" onclick="toggleSection('flashcards-hub')">
                <i class="fas fa-clone"></i>
                <span>Flashcards</span>
            </button>
        `;
        
        // Ajouter la barre de navigation au body
        document.body.appendChild(mobileNav);
    }
    
    // Fonction pour afficher/masquer la barre selon la taille de l'écran
    function toggleMobileNavVisibility() {
        if (window.innerWidth <= 768) {
            mobileNav.style.display = 'flex';
        } else {
            mobileNav.style.display = 'none';
        }
    }
    
    // Exécuter au chargement
    toggleMobileNavVisibility();
    
    // Exécuter à chaque redimensionnement
    window.addEventListener('resize', toggleMobileNavVisibility);
    
    // Mettre en évidence le bouton de la section active
    function updateActiveButton() {
        const activeSection = document.querySelector('.section.active');
        if (!activeSection) return;
        
        const sectionId = activeSection.id;
        const buttons = mobileNav.querySelectorAll('.btn');
        
        buttons.forEach(btn => {
            const onclickAttr = btn.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes(sectionId)) {
                btn.classList.add('active-nav-btn');
                btn.style.color = 'var(--primary)';
             } else {
                btn.classList.remove('active-nav-btn');
                btn.style.color = '';
             }
         });
    }
    
    // Observer les changements de section pour mettre à jour les boutons
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'class') {
                if (mutation.target.classList.contains('active')) {
                    updateActiveButton();
                }
            }
        });
    });
    
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        observer.observe(section, { attributes: true });
    });
    
    // Exécuter au chargement
    updateActiveButton();
}

// --- Quiz Hub ---
const quizQuestions = [
    {
        question: "Quelle est la version la plus récente du protocole TLS ?",
        options: ["TLS 1.0", "TLS 1.1", "TLS 1.2", "TLS 1.3"],
        correctAnswer: 3,
        explanation: "TLS 1.3 est la version la plus récente, publiée en 2018. Elle offre une sécurité améliorée et une meilleure performance par rapport aux versions précédentes.",
        category: "ssl-tls"
    },
    {
        question: "Qu'est-ce que le Zero Trust en cybersécurité ?",
        options: [
            "Un modèle où tous les systèmes internes sont automatiquement approuvés", 
            "Un modèle qui ne fait confiance à aucun utilisateur par défaut, qu'il soit interne ou externe", 
            "Un système qui n'utilise pas d'authentification", 
            "Un système sans pare-feu"
        ],
        correctAnswer: 1,
        explanation: "Zero Trust est un modèle de sécurité qui ne fait confiance à aucun utilisateur ou appareil par défaut, qu'il se trouve à l'intérieur ou à l'extérieur du réseau, et exige une vérification constante.",
        category: "securite"
    },
    {
        question: "Qu'est-ce qu'une CA (Certificate Authority) dans une PKI ?",
        options: [
            "Un logiciel de chiffrement", 
            "Une entité qui émet des certificats numériques", 
            "Un type de certificat utilisé pour les serveurs web", 
            "Un protocole d'authentification"
        ],
        correctAnswer: 1,
        explanation: "Une Autorité de Certification (CA) est une entité de confiance qui émet des certificats numériques, qui lient une clé publique à une identité (personne, serveur ou organisation).",
        category: "pki"
    },
    {
        question: "Quelle est la différence principale entre TCP et UDP ?",
        options: [
            "TCP utilise IPv6, UDP utilise IPv4", 
            "TCP est plus récent que UDP", 
            "TCP garantit la livraison ordonnée des paquets, UDP ne le garantit pas", 
            "UDP est chiffré, TCP ne l'est pas"
        ],
        correctAnswer: 2,
        explanation: "TCP (Transmission Control Protocol) garantit la livraison ordonnée et sans erreur des paquets, établissant une connexion fiable. UDP (User Datagram Protocol) est sans connexion et ne garantit ni la livraison, ni l'ordre des paquets.",
        category: "protocoles"
    },
    {
        question: "Qu'est-ce qu'un VLAN ?",
        options: [
            "Un type de réseau sans fil", 
            "Un réseau local virtuel permettant de segmenter logiquement un réseau physique", 
            "Un protocole de routage", 
            "Un type de VPN"
        ],
        correctAnswer: 1,
        explanation: "Un VLAN (Virtual Local Area Network) est un réseau local virtuel qui permet de regrouper des appareils de manière logique, indépendamment de leur emplacement physique, améliorant ainsi la sécurité et la gestion du réseau.",
        category: "reseaux"
    },
    {
        question: "Qu'est-ce qu'une relation de confiance transitive dans Active Directory ?",
        options: [
            "Une relation entre deux domaines uniquement", 
            "Une relation qui n'autorise qu'un accès limité", 
            "Une relation où si A fait confiance à B et B fait confiance à C, alors A fait confiance à C", 
            "Une relation qui exige une authentification à chaque accès"
        ],
        correctAnswer: 2,
        explanation: "Dans une relation de confiance transitive, si le domaine A fait confiance au domaine B, et que B fait confiance à C, alors A fait automatiquement confiance à C sans qu'une relation directe soit nécessaire.",
        category: "active-directory"
    },
    {
        question: "Qu'est-ce que le protocole OCSP dans le contexte des certificats numériques ?",
        options: [
            "Un protocole de renouvellement automatique des certificats", 
            "Un protocole pour vérifier en temps réel si un certificat a été révoqué", 
            "Un protocole de communication entre certificats", 
            "Un standard pour les certificats auto-signés"
        ],
        correctAnswer: 1,
        explanation: "OCSP (Online Certificate Status Protocol) est un protocole qui permet de vérifier en temps réel si un certificat numérique a été révoqué, offrant une alternative plus efficace aux listes de révocation de certificats (CRL).",
        category: "pki"
    },
    {
        question: "Qu'est-ce qu'un ransomware ?",
        options: [
            "Un logiciel qui analyse les vulnérabilités", 
            "Un virus qui ralentit le système", 
            "Un logiciel malveillant qui chiffre les données et demande une rançon", 
            "Un type de pare-feu"
        ],
        correctAnswer: 2,
        explanation: "Un ransomware est un type de logiciel malveillant qui chiffre les données de la victime, rendant les fichiers et systèmes inaccessibles, puis exige le paiement d'une rançon pour fournir la clé de déchiffrement.",
        category: "securite"
    },
    {
        question: "Qu'est-ce que la DMZ (Zone démilitarisée) dans un réseau ?",
        options: [
            "Une zone où aucun trafic réseau n'est autorisé", 
            "Un sous-réseau qui sépare le réseau interne d'Internet", 
            "Une zone sans serveurs", 
            "Un réseau sans fil isolé"
        ],
        correctAnswer: 1,
        explanation: "Une DMZ est un sous-réseau qui sert de zone tampon entre le réseau interne sécurisé d'une organisation et Internet (ou d'autres réseaux non fiables), permettant d'exposer certains services externes tout en protégeant le réseau interne.",
        category: "reseaux"
    },
    {
        question: "Qu'est-ce que le protocole TLS Handshake ?",
        options: [
            "Un processus pour établir une connexion sécurisée entre client et serveur", 
            "Un mécanisme de transfert de fichiers", 
            "Un protocole de sauvegarde de données", 
            "Un système d'authentification par mot de passe"
        ],
        correctAnswer: 0,
        explanation: "Le TLS Handshake est le processus par lequel un client et un serveur établissent une connexion sécurisée en échangeant des paramètres cryptographiques, vérifiant l'identité du serveur et établissant des clés de session pour le chiffrement.",
        category: "ssl-tls"
    },
    {
        question: "Qu'est-ce que DHCP (Dynamic Host Configuration Protocol) ?",
        options: [
            "Un protocole de transfert de fichiers", 
            "Un protocole de résolution de noms", 
            "Un protocole qui attribue automatiquement des adresses IP aux appareils", 
            "Un protocole de routage"
        ],
        correctAnswer: 2,
        explanation: "DHCP est un protocole réseau qui permet d'attribuer automatiquement des adresses IP et d'autres paramètres de configuration réseau aux appareils, simplifiant ainsi l'administration réseau.",
        category: "protocoles"
    },
    {
        question: "Qu'est-ce que l'authentification multi-facteurs (MFA) ?",
        options: [
            "L'utilisation de plusieurs mots de passe", 
            "Une méthode nécessitant plusieurs preuves d'identité de différentes catégories", 
            "L'authentification par plusieurs administrateurs", 
            "L'utilisation d'un seul facteur d'authentification très fort"
        ],
        correctAnswer: 1,
        explanation: "L'authentification multi-facteurs (MFA) est une méthode de sécurité qui exige que les utilisateurs fournissent au moins deux formes différentes de vérification d'identité, combinant ce qu'ils savent (mot de passe), ce qu'ils possèdent (téléphone) et ce qu'ils sont (biométrie).",
        category: "securite"
    },
    {
        question: "Que signifie PCI DSS ?",
        options: [
            "Personal Computer Digital Security System", 
            "Payment Card Industry Data Security Standard", 
            "Protocol Communication Interface for Secure Systems", 
            "Public Certificate Infrastructure Digital Signature Standard"
        ],
        correctAnswer: 1,
        explanation: "PCI DSS (Payment Card Industry Data Security Standard) est une norme de sécurité pour les organisations qui traitent, stockent ou transmettent des informations de cartes de paiement, visant à garantir un environnement sécurisé pour ces données.",
        category: "securite"
    },
    {
        question: "Qu'est-ce qu'un contrôleur de domaine dans Active Directory ?",
        options: [
            "Un ordinateur qui contrôle l'accès à Internet", 
            "Un serveur qui stocke la base de données d'annuaire et gère l'authentification", 
            "Un appareil qui filtre le trafic réseau", 
            "Un administrateur ayant tous les droits sur le domaine"
        ],
        correctAnswer: 1,
        explanation: "Un contrôleur de domaine est un serveur qui exécute Active Directory Domain Services (AD DS), stocke une copie de la base de données d'annuaire et gère les demandes d'authentification des utilisateurs et des ordinateurs du domaine.",
        category: "active-directory"
    },
    {
        question: "Qu'est-ce qu'un EDR (Endpoint Detection and Response) ?",
        options: [
            "Un type d'antivirus traditionnel", 
            "Un protocole de communication sécurisée", 
            "Une solution qui surveille et réagit aux menaces avancées sur les terminaux", 
            "Un système de gestion des mots de passe"
        ],
        correctAnswer: 2,
        explanation: "EDR est une solution de sécurité qui surveille en continu les terminaux (ordinateurs, serveurs) pour détecter les comportements suspects et les menaces avancées, permettant une réponse rapide aux incidents de sécurité.",
        category: "securite"
    },
    {
        question: "Qu'est-ce qu'un APT (Advanced Persistent Threat) ?",
        options: [
            "Un type de VPN avancé", 
            "Une faille de sécurité critique", 
            "Un attaque complexe et ciblée qui persiste sur une longue période", 
            "Un protocole de chiffrement"
        ],
        correctAnswer: 2,
        explanation: "Un APT est une attaque ciblée et prolongée où des attaquants sophistiqués établissent une présence furtive et durable dans le réseau ciblé pour extraire des données ou causer des dommages, souvent menée par des groupes bien financés ou parrainés par des États.",
        category: "securite"
    },
    {
        question: "Qu'est-ce qu'un SIEM (Security Information and Event Management) ?",
        options: [
            "Un type de certificat de sécurité", 
            "Un système de gestion des identités", 
            "Une solution qui collecte et analyse les logs de sécurité de diverses sources", 
            "Un protocole d'échange de clés"
        ],
        correctAnswer: 2,
        explanation: "SIEM est une solution qui combine la gestion des informations de sécurité et la gestion des événements de sécurité, collectant et analysant les logs et alertes de sécurité de diverses sources pour détecter les menaces et faciliter la réponse aux incidents.",
        category: "securite"
    },
    {
        question: "Quel est le rôle principal d'ISO 27001 ?",
        options: [
            "Définir des protocoles réseau", 
            "Spécifier des exigences pour établir un système de management de la sécurité de l'information", 
            "Standardiser le format des adresses IP", 
            "Réglementer l'accès Internet"
        ],
        correctAnswer: 1,
        explanation: "ISO 27001 est une norme internationale qui spécifie les exigences pour établir, implémenter, maintenir et améliorer continuellement un système de management de la sécurité de l'information (SMSI) au sein d'une organisation.",
        category: "securite"
    },
    {
        question: "Qu'est-ce que le NIST Cybersecurity Framework ?",
        options: [
            "Un logiciel de sécurité", 
            "Un ensemble de directives et bonnes pratiques pour gérer les risques de cybersécurité", 
            "Un protocole de chiffrement", 
            "Un standard pour les certificats numériques"
        ],
        correctAnswer: 1,
        explanation: "Le NIST Cybersecurity Framework est un cadre volontaire de normes, directives et bonnes pratiques pour gérer les risques de cybersécurité, organisé autour de cinq fonctions principales : Identifier, Protéger, Détecter, Répondre et Récupérer.",
        category: "securite"
    },
    {
        question: "Qu'est-ce que le phishing ?",
        options: [
            "Une technique pour optimiser le trafic réseau", 
            "Une méthode d'ingénierie sociale visant à tromper les utilisateurs pour obtenir des informations sensibles", 
            "Un protocole de partage de fichiers", 
            "Un type de chiffrement"
        ],
        correctAnswer: 1,
        explanation: "Le phishing est une technique d'ingénierie sociale où les attaquants se font passer pour des entités légitimes (banques, services en ligne) afin de manipuler les utilisateurs et les inciter à divulguer des informations sensibles comme les mots de passe ou coordonnées bancaires.",
        category: "securite"
    }
];

function setupQuizHub() {
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const categoryFilter = document.getElementById('quiz-category-filter');
    const quizContainer = document.getElementById('quiz-container');
    const quizProgress = document.getElementById('quiz-progress');
    const quizQuestion = document.getElementById('quiz-question');
    const quizOptions = document.getElementById('quiz-options');
    const quizExplanation = document.getElementById('quiz-explanation');
    const quizNextBtn = document.getElementById('quiz-next-btn');
    const quizSkipBtn = document.getElementById('quiz-skip-btn');
    const quizResult = document.getElementById('quiz-result');
    const finalScore = document.getElementById('final-score');
    const finalTotal = document.getElementById('final-total');
    const scorePercentage = document.getElementById('score-percentage');
    const categoryStats = document.getElementById('category-stats');
    const quizRecommendations = document.getElementById('quiz-recommendations');
    const currentQuestion = document.getElementById('current-question');
    const totalQuestions = document.getElementById('total-questions');
    const quizHubScore = document.getElementById('quiz-hub-score');
    const progressBar = document.getElementById('quiz-progress-bar');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');
    const reviewAnswersBtn = document.getElementById('review-answers-btn');
    const quizReview = document.getElementById('quiz-review');
    const reviewContainer = document.getElementById('review-container');
    const backToResultsBtn = document.getElementById('back-to-results-btn');
    
    if (!startQuizBtn || !categoryFilter || !quizContainer || !quizProgress || 
        !quizQuestion || !quizOptions || !quizExplanation || !quizNextBtn || 
        !quizSkipBtn || !quizResult || !finalScore || !finalTotal || 
        !scorePercentage || !categoryStats || !quizRecommendations || 
        !currentQuestion || !totalQuestions || !quizHubScore || !progressBar || 
        !restartQuizBtn || !reviewAnswersBtn || !quizReview || !reviewContainer || 
        !backToResultsBtn) {
        // console.warn("Quiz hub elements not found. Skipping setup."); // Removing log
        return;
    }
    
    let currentQuizQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let userAnswers = [];
    let selectedCategory = 'all';
    
    startQuizBtn.addEventListener('click', startQuiz);
    categoryFilter.addEventListener('change', function() {
        selectedCategory = this.value;
    });
    quizNextBtn.addEventListener('click', goToNextQuestion);
    quizSkipBtn.addEventListener('click', skipQuestion);
    restartQuizBtn.addEventListener('click', startQuiz);
    reviewAnswersBtn.addEventListener('click', showReview);
    backToResultsBtn.addEventListener('click', () => {
        quizReview.classList.add('hidden');
        quizResult.classList.remove('hidden');
    });
    
    function startQuiz() {
        // Filter questions by category if needed
        if (selectedCategory === 'all') {
            currentQuizQuestions = [...quizQuestions];
        } else {
            currentQuizQuestions = quizQuestions.filter(q => q.category === selectedCategory);
        }
        
        // Shuffle the questions
        currentQuizQuestions = shuffleArray(currentQuizQuestions);
        
        // Reset state
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = [];
        
        // Hide result panel if visible
        quizResult.classList.add('hidden');
        quizReview.classList.add('hidden');
        
        // Show quiz container and progress
        quizContainer.classList.remove('hidden');
        quizProgress.classList.remove('hidden');
        
        // Update total questions
        totalQuestions.textContent = currentQuizQuestions.length;
        
        // Load first question
        loadQuestion();
    }
    
    function loadQuestion() {
        // Update progress indicators
        currentQuestion.textContent = currentQuestionIndex + 1;
        quizHubScore.textContent = score;
        const progressPercentage = ((currentQuestionIndex + 1) / currentQuizQuestions.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        
        const question = currentQuizQuestions[currentQuestionIndex];
        
        // Display the question
        quizQuestion.textContent = question.question;
        
        // Clear previous options and explanation
        quizOptions.innerHTML = '';
        quizExplanation.classList.add('hidden');
        
        // Add new options
        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'quiz-option p-4 bg-darker rounded-lg cursor-pointer hover:bg-primary hover:text-white transition-colors';
            optionDiv.textContent = option;
            optionDiv.dataset.index = index;
            
            optionDiv.addEventListener('click', function() {
                selectOption(this, index);
            });
            
            quizOptions.appendChild(optionDiv);
        });
        
        // Disable next button until an option is selected
        quizNextBtn.disabled = true;
    }
    
    function selectOption(optionElement, optionIndex) {
        const question = currentQuizQuestions[currentQuestionIndex];
        const isCorrect = optionIndex === question.correctAnswer;
        
        // Disable all options
        const allOptions = quizOptions.querySelectorAll('.quiz-option');
        allOptions.forEach(opt => {
            opt.classList.remove('hover:bg-primary');
            opt.classList.add('pointer-events-none');
        });
        
        // Mark selected option
        optionElement.classList.remove('bg-darker');
        optionElement.classList.add(isCorrect ? 'bg-green-600' : 'bg-red-600');
        optionElement.classList.add('text-white');
        
        // Mark correct option if selected was wrong
        if (!isCorrect) {
            allOptions[question.correctAnswer].classList.remove('bg-darker');
            allOptions[question.correctAnswer].classList.add('bg-green-600', 'text-white');
        }
        
        // Show explanation
        quizExplanation.innerHTML = `<p class="text-${isCorrect ? 'green' : 'red'}-400 font-bold mb-2">${isCorrect ? 'Correct !' : 'Incorrect'}</p>
                                    <p>${question.explanation}</p>`;
        quizExplanation.classList.remove('hidden');
        
        // Update score
        if (isCorrect) {
            score++;
            quizHubScore.textContent = score;
        }
        
        // Record user's answer
        userAnswers.push({
            question: question.question,
            userAnswerIndex: optionIndex,
            correctAnswerIndex: question.correctAnswer,
            isCorrect: isCorrect,
            explanation: question.explanation,
            category: question.category
        });
        
        // Enable next button
        quizNextBtn.disabled = false;
    }
    
    function goToNextQuestion() {
        currentQuestionIndex++;
        
        if (currentQuestionIndex < currentQuizQuestions.length) {
            loadQuestion();
        } else {
            showResults();
        }
    }
    
    function skipQuestion() {
        // Record as skipped
        userAnswers.push({
            question: currentQuizQuestions[currentQuestionIndex].question,
            userAnswerIndex: null,
            correctAnswerIndex: currentQuizQuestions[currentQuestionIndex].correctAnswer,
            isCorrect: false,
            explanation: currentQuizQuestions[currentQuestionIndex].explanation,
            category: currentQuizQuestions[currentQuestionIndex].category,
            skipped: true
        });
        
        goToNextQuestion();
    }
    
    function showResults() {
        // Hide quiz container
        quizContainer.classList.add('hidden');
        quizProgress.classList.add('hidden');
        
        // Show results
        quizResult.classList.remove('hidden');
        
        // Update score
        finalScore.textContent = score;
        finalTotal.textContent = currentQuizQuestions.length;
        scorePercentage.textContent = Math.round((score / currentQuizQuestions.length) * 100);
        
        // Calculate category statistics
        const categories = {};
        
        userAnswers.forEach(answer => {
            if (!categories[answer.category]) {
                categories[answer.category] = {
                    total: 0,
                    correct: 0,
                    name: getCategoryName(answer.category)
                };
            }
            
            categories[answer.category].total++;
            if (answer.isCorrect) {
                categories[answer.category].correct++;
            }
        });
        
        // Display category stats
        categoryStats.innerHTML = '';
        
        Object.values(categories).forEach(category => {
            const percentage = Math.round((category.correct / category.total) * 100);
            const colorClass = percentage >= 70 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';
            
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'bg-darker p-3 rounded';
            categoryDiv.innerHTML = `
                <h4 class="font-bold mb-2">${category.name}</h4>
                <p class="text-sm mb-1">${category.correct}/${category.total} (${percentage}%)</p>
                <div class="w-full bg-darkest rounded-full h-2">
                    <div class="${colorClass} h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
            `;
            
            categoryStats.appendChild(categoryDiv);
        });
        
        // Generate recommendations
        let recommendations = '';
        const weakCategories = Object.entries(categories)
            .filter(([_, stats]) => (stats.correct / stats.total) < 0.7)
            .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total));
        
        if (weakCategories.length === 0) {
            recommendations = `<p class="text-green-400">Excellent travail ! Vous avez de bonnes connaissances dans tous les domaines testés.</p>`;
        } else {
            recommendations = `<p class="mb-2">Domaines à améliorer :</p><ul class="list-disc pl-5 space-y-1">`;
            
            weakCategories.forEach(([category, stats]) => {
                recommendations += `<li><strong>${stats.name}</strong> (${Math.round((stats.correct / stats.total) * 100)}%) - Révisez cette section</li>`;
            });
            
            recommendations += `</ul>`;
        }
        
        quizRecommendations.innerHTML = recommendations;
    }
    
    function showReview() {
        // Hide results
        quizResult.classList.add('hidden');
        
        // Show review
        quizReview.classList.remove('hidden');
        
        // Clear previous review
        reviewContainer.innerHTML = '';
        
        // Add all questions and answers
        userAnswers.forEach((answer, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'mb-6 p-4 bg-darker rounded-lg';
            
            let statusIcon = '';
            if (answer.skipped) {
                statusIcon = '<i class="fas fa-minus-circle text-yellow-500 mr-2"></i>';
            } else if (answer.isCorrect) {
                statusIcon = '<i class="fas fa-check-circle text-green-500 mr-2"></i>';
            } else {
                statusIcon = '<i class="fas fa-times-circle text-red-500 mr-2"></i>';
            }
            
            questionDiv.innerHTML = `
                <div class="flex items-start">
                    <div class="text-xl mr-3">${index + 1}.</div>
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            ${statusIcon}
                            <h3 class="font-bold text-lg">${answer.question}</h3>
                        </div>
                        
                        <div class="ml-6">
                            ${answer.skipped ? 
                                '<p class="italic text-yellow-500 mb-2">Question ignorée</p>' : 
                                `<p class="mb-2">Votre réponse: <span class="${answer.isCorrect ? 'text-green-500' : 'text-red-500'}">${currentQuizQuestions[index].options[answer.userAnswerIndex]}</span></p>`
                            }
                            
                            ${!answer.isCorrect ? 
                                `<p class="mb-2">Réponse correcte: <span class="text-green-500">${currentQuizQuestions[index].options[answer.correctAnswerIndex]}</span></p>` : 
                                ''
                            }
                            
                            <div class="bg-darkest p-3 rounded mt-2">
                                <p class="text-sm">${answer.explanation}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            reviewContainer.appendChild(questionDiv);
        });
    }
    
    function getCategoryName(categoryId) {
        const names = {
            'active-directory': 'Active Directory',
            'ssl-tls': 'SSL/TLS',
            'reseaux': 'Réseaux informatiques',
            'securite': 'Sécurité',
            'pki': 'PKI et Certificats',
            'protocoles': 'Protocoles réseau'
        };
        
        return names[categoryId] || categoryId;
    }
    
    function shuffleArray(array) {
        // Create a copy to avoid modifying the original
        const newArray = [...array];
        
        for (let i = newArray.length - 1; i > 0; i--) {
            // Pick a random index from 0 to i
            const j = Math.floor(Math.random() * (i + 1));
            // Swap elements at i and j
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        
        return newArray;
    }
}

// --- Flashcards Hub ---
function setupFlashcardsHub() {
    const flashcardsContainer = document.getElementById('flashcards-container');
    const categoryFilter = document.getElementById('flashcard-category-filter');
    const shuffleBtn = document.getElementById('shuffle-flashcards-btn');
    const prevBtn = document.getElementById('prev-flashcard');
    const nextBtn = document.getElementById('next-flashcard');
    const currentFlashcardEl = document.getElementById('current-flashcard');
    const totalFlashcardsEl = document.getElementById('total-flashcards');
    
    if (!flashcardsContainer || !categoryFilter || !shuffleBtn || !prevBtn || !nextBtn || !currentFlashcardEl || !totalFlashcardsEl) {
        // console.warn("Flashcards hub elements not found. Skipping setup."); // Removing log
        return;
    }
    
    let allFlashcards = Array.from(flashcardsContainer.querySelectorAll('.flashcard'));
    let visibleFlashcards = allFlashcards;
    let currentIndex = 0;
    
    // Initial setup
    updateCounters();
    setupFlashcardNavigation();
    
    // Ajouter un gestionnaire d'événements pour le clic sur les flashcards
    allFlashcards.forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('flipped');
        });
    });
    
    // Event listeners
    categoryFilter.addEventListener('change', filterFlashcards);
    shuffleBtn.addEventListener('click', shuffleFlashcards);
    prevBtn.addEventListener('click', showPreviousFlashcard);
    nextBtn.addEventListener('click', showNextFlashcard);
    
    function filterFlashcards() {
        const selectedCategory = categoryFilter.value;
        
        if (selectedCategory === 'all') {
            visibleFlashcards = allFlashcards;
        } else {
            visibleFlashcards = allFlashcards.filter(card => card.dataset.category === selectedCategory);
        }
        
        // Update display
        allFlashcards.forEach(card => {
            if (visibleFlashcards.includes(card)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
        
        // Reset to first card
        currentIndex = 0;
        updateCounters();
        focusCurrentCard();
    }
    
    function shuffleFlashcards() {
        // Only shuffle visible cards
        const shuffledArray = [...visibleFlashcards];
        
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            
            // Swap DOM elements in the container
            if (i !== j) {
                const parent = shuffledArray[i].parentNode;
                const detatchedNode = shuffledArray[i];
                const insertBeforeNode = shuffledArray[j].nextSibling === shuffledArray[i] ? 
                    shuffledArray[j] : shuffledArray[j].nextSibling;
                
                parent.insertBefore(detatchedNode, insertBeforeNode);
                
                // Update the shuffled array to match the new DOM order
                [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
            }
        }
        
        // Update our array to match the new DOM order
        visibleFlashcards = Array.from(flashcardsContainer.querySelectorAll('.flashcard')).filter(
            card => !card.classList.contains('hidden')
        );
        
        // Reset to first card
        currentIndex = 0;
        updateCounters();
        focusCurrentCard();
    }
    
    function showPreviousFlashcard() {
        if (currentIndex > 0) {
            currentIndex--;
            updateCounters();
            focusCurrentCard();
        }
    }
    
    function showNextFlashcard() {
        if (currentIndex < visibleFlashcards.length - 1) {
            currentIndex++;
            updateCounters();
            focusCurrentCard();
        }
    }
    
    function updateCounters() {
        currentFlashcardEl.textContent = visibleFlashcards.length > 0 ? currentIndex + 1 : 0;
        totalFlashcardsEl.textContent = visibleFlashcards.length;
        
        // Update button states
        prevBtn.disabled = currentIndex === 0 || visibleFlashcards.length === 0;
        nextBtn.disabled = currentIndex >= visibleFlashcards.length - 1 || visibleFlashcards.length === 0;
    }
    
    function focusCurrentCard() {
        if (visibleFlashcards.length === 0) return;
        
        // Reset all cards
        visibleFlashcards.forEach(card => {
            card.classList.remove('active-flashcard');
            // Ensure cards are not flipped when switching
            card.classList.remove('flipped');
        });
        
        // Mark current card
        visibleFlashcards[currentIndex].classList.add('active-flashcard');
        
        // Scroll to the card
        visibleFlashcards[currentIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
    
    function setupFlashcardNavigation() {
        // Add touch gestures for swiping
        let touchStartX = 0;
        let touchEndX = 0;
        
        flashcardsContainer.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        flashcardsContainer.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, false);
        
        function handleSwipe() {
            const swipeThreshold = 50; // Minimum distance required for a swipe
            
            if (touchEndX < touchStartX - swipeThreshold) {
                // Swipe left - next
                showNextFlashcard();
            }
            
            if (touchEndX > touchStartX + swipeThreshold) {
                // Swipe right - previous
                showPreviousFlashcard();
            }
        }
        
        // Add keyboard navigation
        document.addEventListener('keydown', e => {
            // Only process if the flashcards section is active
            const flashcardsSection = document.getElementById('flashcards-hub');
            if (!flashcardsSection.classList.contains('active')) return;
            
            if (e.key === 'ArrowLeft') {
                showPreviousFlashcard();
            } else if (e.key === 'ArrowRight') {
                showNextFlashcard();
            } else if (e.key === ' ' || e.key === 'Enter') {
                // Flip the current card
                if (visibleFlashcards.length > 0) {
                    visibleFlashcards[currentIndex].classList.toggle('flipped');
                }
            }
        });
    }
}

// Initialiser le quiz hub et les flashcards
setupQuizHub();
setupFlashcardsHub();

window.addEventListener('resize', () => {
    checkSidebarState();
    updateSidebarIcon(); // Also update icon on resize
}); 