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
    },
    {
        question: "Quel rôle AD DS (Active Directory Domain Services) est responsable de la gestion des modifications de schéma pour toute la forêt ?",
        options: ["Maître d'infrastructure", "Maître RID", "Maître de schéma", "Émulateur PDC"],
        correctAnswer: 2,
        explanation: "Le Maître de schéma est le seul contrôleur de domaine dans la forêt autorisé à traiter les mises à jour du schéma Active Directory.",
        category: "active-directory"
    },
    {
        question: "Quel type de relation de confiance est créé automatiquement entre un domaine parent et un domaine enfant dans une forêt AD ?",
        options: ["Externe", "Forêt", "Raccourci", "Parent-Enfant (Transitive)"],
        correctAnswer: 3,
        explanation: "Une relation de confiance bidirectionnelle et transitive est automatiquement créée entre un domaine parent et un domaine enfant lors de la création de ce dernier.",
        category: "active-directory"
    },
    {
        question: "Qu'est-ce qu'un catalogue global (Global Catalog) dans Active Directory ?",
        options: [
            "Un index complet de tous les objets de son propre domaine", 
            "Une copie complète de la base de données AD de tous les domaines", 
            "Un index partiel en lecture seule de tous les objets de tous les domaines de la forêt", 
            "Un serveur DNS spécifique à AD"
        ],
        correctAnswer: 2,
        explanation: "Le catalogue global contient une réplique partielle en lecture seule de chaque objet de chaque domaine de la forêt, permettant des recherches rapides à l'échelle de la forêt et facilitant les ouvertures de session.",
        category: "active-directory"
    },
    {
        question: "Quel composant est essentiel pour l'installation d'AD CS (Active Directory Certificate Services) ?",
        options: ["Un serveur Web (IIS)", "Un serveur DHCP", "Un serveur de fichiers", "Un serveur DNS"],
        correctAnswer: 0,
        explanation: "IIS (Internet Information Services) est requis pour héberger les services web d'inscription de certificats et la publication des listes de révocation (CRL).",
        category: "pki" // Peut aussi être AD, mais focalisé sur CS install
    },
    {
        question: "Quelle 'cipher suite' est généralement considérée comme la plus sécurisée parmi les suivantes pour TLS 1.2 ?",
        options: [
            "TLS_RSA_WITH_RC4_128_SHA", 
            "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", 
            "TLS_RSA_WITH_3DES_EDE_CBC_SHA", 
            "TLS_DH_anon_WITH_AES_128_CBC_SHA"
        ],
        correctAnswer: 1,
        explanation: "Les suites utilisant ECDHE pour l'échange de clés (assurant la confidentialité persistante), RSA pour l'authentification, AES en mode GCM (chiffrement authentifié) avec des clés de 256 bits et SHA384 sont considérées comme très robustes pour TLS 1.2.",
        category: "ssl-tls"
    },
    {
        question: "Qu'est-ce que le 'Server Name Indication' (SNI) dans le contexte TLS ?",
        options: [
            "Une méthode pour vérifier le nom du serveur après la connexion", 
            "Une extension TLS permettant au client d'indiquer le nom d'hôte auquel il tente de se connecter au début du handshake", 
            "Un type de certificat spécifique pour les serveurs virtuels", 
            "Un protocole pour synchroniser les noms de serveurs"
        ],
        correctAnswer: 1,
        explanation: "SNI permet à un serveur d'héberger plusieurs certificats TLS pour différents noms d'hôte sur une seule adresse IP, car le client spécifie le nom d'hôte désiré lors du handshake.",
        category: "ssl-tls"
    },
    {
        question: "Quel modèle d'architecture réseau décrit la communication en 7 couches distinctes ?",
        options: ["Modèle TCP/IP", "Modèle OSI", "Modèle Hybride", "Modèle de von Neumann"],
        correctAnswer: 1,
        explanation: "Le modèle OSI (Open Systems Interconnection) décompose la communication réseau en 7 couches : Physique, Liaison de données, Réseau, Transport, Session, Présentation, Application.",
        category: "reseaux"
    },
    {
        question: "Quelle est la principale différence entre un hub et un switch ?",
        options: [
            "Un hub fonctionne à la couche 3, un switch à la couche 2", 
            "Un switch crée des domaines de collision séparés pour chaque port, un hub non", 
            "Un hub est plus rapide qu'un switch", 
            "Un switch utilise des adresses IP, un hub utilise des adresses MAC"
        ],
        correctAnswer: 1,
        explanation: "Un hub répète simplement le signal reçu sur tous les ports (un seul domaine de collision), tandis qu'un switch apprend les adresses MAC connectées à chaque port et ne transfère les trames que vers le port concerné, créant des domaines de collision distincts.",
        category: "reseaux"
    },
    {
        question: "Quelle est la fonction principale d'un routeur ?",
        options: [
            "Connecter des appareils au sein d'un même réseau local", 
            "Interconnecter différents réseaux et déterminer le meilleur chemin pour acheminer les paquets", 
            "Attribuer des adresses IP aux appareils", 
            "Filtrer le trafic en fonction des adresses MAC"
        ],
        correctAnswer: 1,
        explanation: "Les routeurs opèrent à la couche 3 (Réseau) et utilisent les adresses IP pour prendre des décisions de routage et acheminer les paquets entre différents réseaux.",
        category: "reseaux" // Ou 'routing'
    },
    {
        question: "Quelle adresse IP est une adresse de boucle locale (loopback) ?",
        options: ["192.168.1.1", "10.0.0.1", "172.16.0.1", "127.0.0.1"],
        correctAnswer: 3,
        explanation: "L'adresse 127.0.0.1 (et plus généralement le réseau 127.0.0.0/8) est réservée pour la boucle locale, permettant à une machine de communiquer avec elle-même à des fins de test.",
        category: "protocoles" // Ou 'ip-addressing'
    },
    {
        question: "Qu'est-ce que le CIDR (Classless Inter-Domain Routing) ?",
        options: [
            "Un ancien système d'adressage IP basé sur des classes (A, B, C)", 
            "Une méthode pour représenter les masques de sous-réseau en utilisant une notation de préfixe (ex: /24)", 
            "Un protocole de routage dynamique", 
            "Un type d'adresse IPv6"
        ],
        correctAnswer: 1,
        explanation: "CIDR permet une allocation plus flexible des adresses IP et une agrégation des routes en spécifiant la longueur du préfixe réseau (le nombre de bits à 1 dans le masque de sous-réseau) après l'adresse IP.",
        category: "ip-addressing"
    },
    {
        question: "Quel protocole de routage est un protocole 'à état de liens' (link-state) ?",
        options: ["RIP", "EIGRP", "OSPF", "BGP (dans sa forme de base)"],
        correctAnswer: 2,
        explanation: "OSPF (Open Shortest Path First) est un protocole de routage interne (IGP) à état de liens. Chaque routeur construit une carte complète de la topologie du réseau pour calculer les meilleurs chemins.",
        category: "routing"
    },
    {
        question: "Quelle commande est utilisée sur un routeur Cisco pour entrer en mode de configuration globale ?",
        options: ["enable", "configure terminal", "interface [type]/[num]", "show running-config"],
        correctAnswer: 1,
        explanation: "La commande `configure terminal` (souvent abrégée en `conf t`) permet de passer du mode d'exécution privilégié (après `enable`) au mode de configuration globale.",
        category: "cisco-routers"
    },
    {
        question: "Comment sauvegarder la configuration en cours ('running-config') dans la configuration de démarrage ('startup-config') sur un routeur Cisco ?",
        options: ["copy running-config startup-config", "write memory", "save config", "Les deux premières options"],
        correctAnswer: 3,
        explanation: "Les commandes `copy running-config startup-config` et son alias plus ancien `write memory` permettent toutes deux de sauvegarder la configuration active pour qu'elle soit chargée au prochain démarrage du routeur.",
        category: "cisco-routers"
    },
    {
        question: "Quel port TCP est utilisé par défaut par le protocole HTTP ?",
        options: ["21", "23", "80", "443"],
        correctAnswer: 2,
        explanation: "Le port TCP 80 est le port standard utilisé pour les communications HTTP non chiffrées.",
        category: "protocoles"
    },
    {
        question: "Quel port UDP est utilisé par défaut par le protocole DNS (pour les requêtes standard) ?",
        options: ["53", "67", "123", "161"],
        correctAnswer: 0,
        explanation: "Le port UDP 53 est principalement utilisé pour les requêtes et réponses DNS standard. TCP 53 est utilisé pour les transferts de zone ou lorsque la réponse dépasse une certaine taille.",
        category: "protocoles"
    },
    {
        question: "Quel est l'objectif principal du processus DORA dans DHCP ?",
        options: [
            "Discover, Offer, Request, Acknowledge - Processus d'attribution d'adresse IP", 
            "Domain, Organization, Router, Address - Structure d'information DHCP", 
            "Data, Operation, Response, Action - Cycle de vie d'une requête DHCP", 
            "Delete, Overwrite, Reassign, Authenticate - Gestion des baux expirés"
        ],
        correctAnswer: 0,
        explanation: "DORA décrit les 4 étapes de l'attribution d'un bail DHCP : le client Découvre (Discover) les serveurs, un serveur Offre (Offer) une adresse, le client la Requiert (Request), et le serveur Confirme (Acknowledge).",
        category: "dhcp" // Ou 'protocoles'
    },
    {
        question: "Quelle édition de Windows Server est généralement utilisée pour les très grandes entreprises nécessitant une haute disponibilité et une grande scalabilité ?",
        options: ["Windows Server Essentials", "Windows Server Standard", "Windows Server Datacenter", "Windows Storage Server"],
        correctAnswer: 2,
        explanation: "Windows Server Datacenter offre le plus grand nombre de fonctionnalités, notamment des droits de virtualisation illimités et des fonctionnalités avancées de stockage et de réseau, adaptées aux environnements exigeants.",
        category: "windows-server"
    },
    {
        question: "Quel outil graphique principal est utilisé pour gérer les rôles et fonctionnalités sur Windows Server ?",
        options: ["Gestionnaire des tâches", "Panneau de configuration", "Gestionnaire de serveur (Server Manager)", "Éditeur de stratégie de groupe (gpedit.msc)"],
        correctAnswer: 2,
        explanation: "Le Gestionnaire de serveur est la console centrale pour installer, configurer et gérer les rôles (comme AD DS, DHCP, DNS, IIS) et les fonctionnalités de Windows Server.",
        category: "windows-server"
    },
    {
        question: "Quel est l'un des principaux objectifs du RGPD (Règlement Général sur la Protection des Données) ?",
        options: [
            "Standardiser les protocoles réseau en Europe", 
            "Protéger les données personnelles des citoyens de l'UE et leur donner plus de contrôle sur leurs données", 
            "Définir les normes de sécurité pour les transactions financières", 
            "Réglementer l'utilisation des logiciels open-source"
        ],
        correctAnswer: 1,
        explanation: "Le RGPD vise à harmoniser les lois sur la protection des données dans toute l'Europe, à renforcer les droits des individus concernant leurs données personnelles (droit d'accès, de rectification, d'effacement, etc.) et à imposer des obligations strictes aux organisations qui traitent ces données.",
        category: "rgpd"
    },
    {
        question: "Quel principe fondamental du RGPD stipule que les données collectées doivent être adéquates, pertinentes et limitées à ce qui est nécessaire au regard des finalités pour lesquelles elles sont traitées ?",
        options: ["Licéité, loyauté et transparence", "Limitation des finalités", "Minimisation des données", "Exactitude"],
        correctAnswer: 2,
        explanation: "Le principe de minimisation des données exige que seules les données strictement nécessaires à l'objectif poursuivi soient collectées et traitées.",
        category: "rgpd"
    },
    {
        question: "Qu'est-ce qu'un IDS (Intrusion Detection System) ?",
        options: [
            "Un système qui bloque activement les attaques détectées", 
            "Un système qui surveille le trafic réseau ou les journaux système à la recherche d'activités suspectes et génère des alertes", 
            "Un type de pare-feu applicatif", 
            "Un outil de chiffrement des communications"
        ],
        correctAnswer: 1,
        explanation: "Un IDS détecte les intrusions potentielles ou les activités malveillantes mais ne les bloque pas directement (contrairement à un IPS - Intrusion Prevention System). Il alerte les administrateurs.",
        category: "securite"
    },
    {
        question: "Quelle est la différence entre RPO (Recovery Point Objective) et RTO (Recovery Time Objective) dans un PCA ?",
        options: [
            "RPO est le temps pour récupérer, RTO est la quantité de données perdues", 
            "RPO est la quantité maximale de perte de données acceptable, RTO est le délai maximal pour restaurer les services", 
            "RPO concerne les sauvegardes, RTO concerne la réplication", 
            "Il n'y a pas de différence significative"
        ],
        correctAnswer: 1,
        explanation: "RPO définit la quantité de données qu'une entreprise peut se permettre de perdre (mesurée en temps depuis la dernière sauvegarde utilisable). RTO définit le temps maximum acceptable pour qu'un système ou service soit de nouveau opérationnel après une interruption.",
        category: "continuite"
    },
    {
        question: "Qu'est-ce qu'un 'Single Point of Failure' (SPOF) ?",
        options: [
            "Un protocole réseau spécifique", 
            "Un composant d'un système dont la défaillance entraînerait l'arrêt complet du système", 
            "Une méthode de cryptage", 
            "Un utilisateur ayant des privilèges excessifs"
        ],
        correctAnswer: 1,
        explanation: "Un SPOF est un élément (matériel, logiciel, processus) critique qui, en cas de panne, compromet la disponibilité de l'ensemble du service ou système. La redondance vise à éliminer les SPOF.",
        category: "continuite" // Ou 'reseaux' ou 'securite'
    },
    // ----- DEUXIÈME SÉRIE DE NOUVELLES QUESTIONS -----
    {
        question: "Quel mécanisme AD permet de déléguer l'administration de certaines parties de l'annuaire sans accorder de droits étendus ?",
        options: ["Relations de confiance", "Unités d'Organisation (OU)", "Sites AD", "Stratégies de groupe (GPO)"],
        correctAnswer: 1,
        explanation: "Les Unités d'Organisation permettent de structurer l'annuaire et de déléguer des permissions spécifiques sur les objets contenus dans une OU à des groupes ou utilisateurs désignés.",
        category: "active-directory"
    },
    {
        question: "Qu'est-ce que le KDC (Key Distribution Center) dans un environnement Kerberos (utilisé par AD) ?",
        options: [
            "Un serveur qui stocke les clés privées des utilisateurs", 
            "Un service, généralement sur un contrôleur de domaine, qui émet des tickets d'authentification (TGT et tickets de service)", 
            "Un protocole de chiffrement symétrique", 
            "Une autorité de certification pour Kerberos"
        ],
        correctAnswer: 1,
        explanation: "Le KDC est un composant central de Kerberos, responsable de l'authentification des utilisateurs et de l'émission des tickets qui leur permettent d'accéder aux ressources réseau de manière sécurisée.",
        category: "active-directory"
    },
    {
        question: "Quel est le rôle d'une CRL (Certificate Revocation List) dans une infrastructure PKI ?",
        options: [
            "Lister tous les certificats valides émis par une CA", 
            "Fournir une méthode pour renouveler les certificats expirés", 
            "Publier une liste des certificats qui ont été révoqués avant leur date d'expiration prévue", 
            "Archiver les anciens certificats"
        ],
        correctAnswer: 2,
        explanation: "Une CRL est une liste signée numériquement par une CA qui contient les numéros de série des certificats qu'elle a émis mais qui ne sont plus valides (par exemple, en cas de compromission de la clé privée).",
        category: "pki"
    },
    {
        question: "Quelle est la différence fondamentale entre le chiffrement symétrique et asymétrique ?",
        options: [
            "Symétrique utilise des clés plus longues", 
            "Asymétrique est plus rapide que symétrique", 
            "Symétrique utilise la même clé pour chiffrer et déchiffrer, tandis qu'asymétrique utilise une paire de clés (publique/privée)", 
            "Seul l'asymétrique est utilisé dans TLS"
        ],
        correctAnswer: 2,
        explanation: "Le chiffrement symétrique (ex: AES) utilise une clé secrète partagée. Le chiffrement asymétrique (ex: RSA) utilise une clé publique pour chiffrer (ou vérifier une signature) et une clé privée correspondante pour déchiffrer (ou signer). TLS utilise les deux.",
        category: "pki" // Ou 'ssl-tls', concept fondamental
    },
    {
        question: "Qu'est-ce que le HSTS (HTTP Strict Transport Security) ?",
        options: [
            "Un nouveau protocole remplaçant HTTPS", 
            "Un en-tête de réponse HTTP qui indique au navigateur qu'il ne doit communiquer avec le site qu'en utilisant HTTPS", 
            "Une méthode de compression pour accélérer HTTPS", 
            "Un certificat TLS spécial"
        ],
        correctAnswer: 1,
        explanation: "HSTS est un mécanisme de sécurité qui permet à un serveur web d'indiquer aux navigateurs que toutes les futures connexions vers ce domaine doivent être faites via HTTPS, protégeant contre les attaques de type SSL stripping.",
        category: "ssl-tls"
    },
    {
        question: "Quel protocole est utilisé pour la résolution des adresses MAC à partir des adresses IP dans un réseau local IPv4 ?",
        options: ["DHCP", "DNS", "ARP", "RARP"],
        correctAnswer: 2,
        explanation: "ARP (Address Resolution Protocol) est utilisé pour mapper une adresse IP connue à l'adresse MAC physique correspondante sur un segment de réseau local.",
        category: "protocoles"
    },
    {
        question: "Qu'est-ce que le NAT (Network Address Translation) ?",
        options: [
            "Une méthode pour chiffrer le trafic IP", 
            "Un processus permettant de modifier les informations d'adresse IP dans les en-têtes de paquets pour mapper un espace d'adressage (ex: privé) à un autre (ex: public)", 
            "Un protocole de routage dynamique", 
            "Un mécanisme d'authentification réseau"
        ],
        correctAnswer: 1,
        explanation: "Le NAT est couramment utilisé sur les routeurs pour permettre à plusieurs appareils utilisant des adresses IP privées de partager une seule adresse IP publique pour accéder à Internet.",
        category: "reseaux" // Ou 'ip-addressing'
    },
    {
        question: "Quelle technologie permet de transporter plusieurs VLANs sur un seul lien physique entre des switchs ?",
        options: ["Spanning Tree Protocol (STP)", "Trunking (ex: IEEE 802.1Q)", "EtherChannel", "HSRP/VRRP"],
        correctAnswer: 1,
        explanation: "Le trunking, notamment avec le standard IEEE 802.1Q, permet de faire passer le trafic de plusieurs VLANs sur un même lien en ajoutant une étiquette (tag) aux trames pour identifier leur VLAN d'origine.",
        category: "reseaux"
    },
    {
        question: "Quel est le but principal du Spanning Tree Protocol (STP) dans un réseau commuté ?",
        options: [
            "Agréger plusieurs liens physiques en un seul lien logique", 
            "Sélectionner le chemin le plus rapide entre deux switchs", 
            "Prévenir les boucles de commutation en bloquant certains ports redondants", 
            "Segmenter le réseau en VLANs"
        ],
        correctAnswer: 2,
        explanation: "STP empêche les boucles de diffusion qui peuvent paralyser un réseau en créant une topologie logique sans boucle, en désactivant sélectivement les liaisons redondantes.",
        category: "reseaux"
    },
    {
        question: "Quelle plage d'adresses IP privées est définie par la RFC 1918 pour la classe B ?",
        options: ["10.0.0.0 à 10.255.255.255", "192.168.0.0 à 192.168.255.255", "172.16.0.0 à 172.31.255.255", "169.254.0.0 à 169.254.255.255"],
        correctAnswer: 2,
        explanation: "La plage d'adresses privées de classe B définie par la RFC 1918 va de 172.16.0.0 à 172.31.255.255.",
        category: "ip-addressing"
    },
    {
        question: "Qu'est-ce qu'une route par défaut (default route) ?",
        options: [
            "La route la plus rapide vers une destination", 
            "Une route utilisée par un routeur lorsqu'aucune autre route plus spécifique ne correspond à l'adresse IP de destination", 
            "Une route statique vers un réseau interne", 
            "Une route apprise via OSPF"
        ],
        correctAnswer: 1,
        explanation: "La route par défaut (souvent 0.0.0.0/0 pour IPv4) indique au routeur où envoyer les paquets dont la destination n'est pas explicitement connue dans sa table de routage, typiquement vers le prochain routeur en direction d'Internet.",
        category: "routing"
    },
    {
        question: "Quelle commande Cisco IOS permet d'afficher la table de routage IP ?",
        options: ["show interfaces", "show ip arp", "show ip route", "show version"],
        correctAnswer: 2,
        explanation: "La commande `show ip route` affiche la table de routage complète du routeur, y compris les routes connectées directement, les routes statiques et les routes apprises dynamiquement.",
        category: "cisco-routers"
    },
    {
        question: "Quel mécanisme assure qu'un seul serveur DHCP sur un sous-réseau répond à une requête DHCP Discover si plusieurs sont présents (pour la redondance) ?",
        options: ["Le client choisit le premier qui répond", "Les serveurs se coordonnent via un protocole dédié", "Le concept de 'DHCP Failover' ou la configuration de délais différents sur les serveurs", "Ce n'est pas possible, un seul serveur DHCP doit être actif par sous-réseau"],
        correctAnswer: 2,
        explanation: "Des mécanismes comme le DHCP Failover (RFC non standard mais implémenté par Microsoft et ISC) ou la configuration de délais de réponse différents sur les serveurs permettent d'assurer la continuité du service sans conflits.",
        category: "dhcp"
    },
    {
        question: "Quelle fonctionnalité de Windows Server permet de gérer de manière centralisée la configuration et les paramètres de sécurité pour les utilisateurs et les ordinateurs d'un domaine AD ?",
        options: ["Gestionnaire de serveur", "Observateur d'événements", "Stratégies de groupe (Group Policies - GPO)", "Services de certificats Active Directory (AD CS)"],
        correctAnswer: 2,
        explanation: "Les stratégies de groupe (GPO) sont un outil puissant pour appliquer des configurations (logiciels, scripts, paramètres Windows, sécurité) de manière cohérente à des ensembles d'utilisateurs et d'ordinateurs définis dans les OU.",
        category: "windows-server" // Ou 'active-directory'
    },
    {
        question: "Qu'est-ce qu'un serveur 'Core' dans le contexte de Windows Server ?",
        options: [
            "Une édition spéciale pour les clusters", 
            "Une option d'installation minimale sans interface graphique utilisateur (GUI) complète", 
            "Le contrôleur de domaine principal", 
            "Un serveur dédié uniquement aux services essentiels comme DNS et DHCP"
        ],
        correctAnswer: 1,
        explanation: "L'installation Server Core réduit la surface d'attaque et les besoins en ressources en omettant l'interface graphique standard. La gestion se fait principalement via ligne de commande (PowerShell, CMD) ou à distance.",
        category: "windows-server"
    },
    {
        question: "Selon le RGPD, qu'est-ce qu'une 'violation de données personnelles' ?",
        options: [
            "Uniquement le piratage d'une base de données", 
            "Toute violation de la sécurité entraînant, de manière accidentelle ou illicite, la destruction, la perte, l'altération, la divulgation non autorisée de données personnelles ou l'accès non autorisé à de telles données", 
            "L'envoi d'un email au mauvais destinataire", 
            "Le non-respect d'une demande de droit d'accès"
        ],
        correctAnswer: 1,
        explanation: "La définition est large et couvre divers incidents de sécurité affectant la confidentialité, l'intégrité ou la disponibilité des données personnelles. Certaines violations doivent être notifiées à l'autorité de contrôle (ex: CNIL) et parfois aux personnes concernées.",
        category: "rgpd"
    },
    {
        question: "Qu'est-ce qu'un VPN (Virtual Private Network) ?",
        options: [
            "Un réseau local sans fil", 
            "Une connexion directe et dédiée entre deux sites", 
            "Une technologie qui crée une connexion sécurisée et chiffrée sur un réseau public (comme Internet)", 
            "Un type de pare-feu avancé"
        ],
        correctAnswer: 2,
        explanation: "Un VPN permet d'étendre un réseau privé sur un réseau public en créant un tunnel chiffré, assurant la confidentialité et l'intégrité des données échangées comme si les appareils étaient connectés sur le même réseau local.",
        category: "securite"
    },
    {
        question: "Quelle technique de sécurité implique de segmenter un réseau en plusieurs zones isolées pour limiter l'impact d'une compromission ?",
        options: ["Chiffrement", "Authentification forte", "Segmentation réseau (utilisation de VLANs, pare-feux internes)", "Mise à jour des systèmes"],
        correctAnswer: 2,
        explanation: "La segmentation réseau vise à contenir les menaces. Si une zone est compromise, les autres zones restent protégées grâce à des contrôles d'accès stricts (souvent via des pare-feux) entre les segments.",
        category: "securite"
    },
    {
        question: "Dans le cadre d'un PCA, qu'est-ce qu'un 'site de secours chaud' (hot site) ?",
        options: [
            "Un site vide avec l'infrastructure de base (électricité, réseau)", 
            "Un site entièrement équipé avec matériel, logiciels et données récentes, prêt à prendre le relais quasi immédiatement", 
            "Un accord avec un fournisseur pour obtenir du matériel en cas de sinistre", 
            "Une sauvegarde externalisée des données"
        ],
        correctAnswer: 1,
        explanation: "Un site chaud est une solution de reprise après sinistre coûteuse mais rapide, offrant une réplique quasi temps réel de l'environnement de production principal, permettant un RTO très faible.",
        category: "continuite"
    },
    {
        question: "Quel utilitaire en ligne de commande est couramment utilisé pour tester la connectivité de base entre deux hôtes IP et mesurer le temps de réponse ?",
        options: ["ipconfig / ifconfig", "tracert / traceroute", "netstat", "ping"],
        correctAnswer: 3,
        explanation: "La commande `ping` envoie des paquets ICMP Echo Request à une destination et attend les réponses (Echo Reply) pour vérifier si l'hôte est joignable et estimer la latence.",
        category: "network-failures" // Outil de diagnostic
    },
    // ----- TROISIÈME SÉRIE DE NOUVELLES QUESTIONS -----
    {
        question: "Dans Active Directory, quel est le rôle principal des Sites ?",
        options: [
            "Organiser les utilisateurs et ordinateurs pour la délégation", 
            "Contrôler la réplication du trafic AD et localiser les services les plus proches", 
            "Définir les limites des forêts et des domaines", 
            "Appliquer des stratégies de groupe spécifiques"
        ],
        correctAnswer: 1,
        explanation: "Les Sites AD représentent la topologie physique du réseau (généralement des emplacements géographiques connectés par des liens WAN) pour optimiser la réplication de l'annuaire et permettre aux clients de trouver les contrôleurs de domaine et services (comme le Catalogue Global) les plus proches.",
        category: "active-directory"
    },
    {
        question: "Quel protocole est utilisé par les contrôleurs de domaine AD pour répliquer les informations de l'annuaire entre eux ?",
        options: ["LDAP", "Kerberos", "RPC (Remote Procedure Call) et/ou SMTP (pour la réplication inter-sites)", "SMB"],
        correctAnswer: 2,
        explanation: "La réplication intra-site utilise principalement RPC. La réplication inter-sites peut être configurée pour utiliser RPC (IP) ou SMTP (bien que moins courant et avec plus de limitations), souvent compressée pour économiser la bande passante.",
        category: "active-directory"
    },
    {
        question: "Quelle est la signification de l'ordre d'application des GPO : LSDOU ?",
        options: [
            "Local, Site, Domain, OU (l'emporte le dernier appliqué, donc OU)", 
            "Least Significant, Domain, Organization, User", 
            "Link, Security, Domain, OU", 
            "Local, System, Directory, User"
        ],
        correctAnswer: 0,
        explanation: "Les stratégies de groupe sont appliquées dans l'ordre : Ordinateur Local, puis celles liées au Site, puis au Domaine, puis aux Unités d'Organisation (de la plus haute à la plus basse dans la hiérarchie). Les paramètres appliqués en dernier (OU) prévalent en cas de conflit, sauf si l'héritage est bloqué ou la GPO est marquée comme 'Enforced'.",
        category: "active-directory"
    },
    {
        question: "Qu'est-ce qu'un modèle de certificat (Certificate Template) dans AD CS ?",
        options: [
            "Un certificat utilisé comme modèle pour tous les autres", 
            "Une configuration prédéfinie qui définit les propriétés et les autorisations pour les certificats qui seront émis", 
            "Un type de CA intermédiaire", 
            "Le fichier de clé privée du certificat"
        ],
        correctAnswer: 1,
        explanation: "Les modèles de certificats simplifient l'administration en définissant les paramètres (durée de validité, usages de clé, taille de clé, etc.) et qui peut demander quel type de certificat (ex: Utilisateur, Ordinateur, Serveur Web).",
        category: "pki"
    },
    {
        question: "Qu'est-ce que le 'Perfect Forward Secrecy' (PFS) dans TLS ?",
        options: [
            "Garantir que le serveur est toujours le bon", 
            "Une propriété des protocoles d'échange de clés qui assure que la compromission de la clé privée à long terme du serveur ne compromet pas les clés de session passées", 
            "Utiliser uniquement des algorithmes de chiffrement parfaits", 
            "Une méthode pour vérifier l'intégrité des messages"
        ],
        correctAnswer: 1,
        explanation: "PFS est généralement obtenu en utilisant des algorithmes d'échange de clés éphémères comme ECDHE ou DHE. Même si la clé privée du serveur est volée plus tard, un attaquant ne peut pas déchiffrer les communications passées enregistrées car les clés de session étaient dérivées de clés temporaires uniques.",
        category: "ssl-tls"
    },
    {
        question: "Quel est le but de l'en-tête 'Content Security Policy' (CSP) en sécurité web ?",
        options: [
            "Chiffrer le contenu de la page", 
            "Définir les politiques de mots de passe pour les utilisateurs", 
            "Permettre au serveur de spécifier les domaines autorisés d'où le navigateur peut charger des ressources (scripts, styles, images...)", 
            "Compesser le contenu pour accélérer le chargement"
        ],
        correctAnswer: 2,
        explanation: "CSP est une couche de sécurité supplémentaire pour atténuer certains types d'attaques, notamment le Cross-Site Scripting (XSS) et l'injection de données, en indiquant au navigateur les sources de contenu approuvées.",
        category: "securite"
    },
    {
        question: "Quelle adresse IPv6 représente l'adresse non spécifiée (équivalent de 0.0.0.0 en IPv4) ?",
        options: ["::1", "fe80::/10", "ff00::/8", "::"],
        correctAnswer: 3,
        explanation: "L'adresse `::` (tous les bits à 0) est l'adresse non spécifiée, utilisée par exemple comme adresse source lorsqu'un hôte n'a pas encore d'adresse configurée (ex: DHCPv6). `::1` est l'adresse de loopback.",
        category: "ip-addressing"
    },
    {
        question: "Quel protocole remplace ARP dans IPv6 pour la résolution d'adresses de couche liaison ?",
        options: ["DHCPv6", "ICMPv6 (avec Neighbor Discovery Protocol - NDP)", "DNSv6", "RARPv6"],
        correctAnswer: 1,
        explanation: "Le Neighbor Discovery Protocol (NDP), qui fait partie d'ICMPv6, gère plusieurs fonctions dont la résolution d'adresses (équivalent ARP), la découverte de routeurs, et la configuration automatique d'adresses (SLAAC).",
        category: "protocoles"
    },
    {
        question: "Qu'est-ce qu'une adresse IPv6 link-local ?",
        options: [
            "Une adresse routable globalement sur Internet", 
            "Une adresse utilisée uniquement pour la communication sur le segment de réseau local physique directement connecté", 
            "Une adresse privée unique au sein d'une organisation", 
            "Une adresse de multicast"
        ],
        correctAnswer: 1,
        explanation: "Les adresses link-local (préfixe fe80::/10) sont automatiquement configurées sur chaque interface IPv6 activée et sont nécessaires au fonctionnement de NDP. Elles ne sont pas routables au-delà du lien local.",
        category: "ip-addressing"
    },
    {
        question: "Dans OSPF, qu'est-ce qu'une 'Area' (zone) ?",
        options: [
            "Un groupe de routeurs partageant la même adresse IP", 
            "Une collection de réseaux et de routeurs regroupés logiquement pour réduire la taille de la base de données link-state et limiter la portée des mises à jour de routage", 
            "Un type spécifique de routeur OSPF", 
            "Une métrique de coût OSPF"
        ],
        correctAnswer: 1,
        explanation: "La division d'un grand domaine OSPF en zones (avec une zone backbone obligatoire, Area 0) améliore la scalabilité en limitant les calculs SPF et la propagation des informations de topologie à l'intérieur de chaque zone.",
        category: "routing"
    },
    {
        question: "Quel protocole est utilisé pour envoyer des emails depuis un client (ex: Outlook) vers un serveur de messagerie, ou entre serveurs de messagerie ?",
        options: ["POP3", "IMAP", "SMTP", "HTTP"],
        correctAnswer: 2,
        explanation: "SMTP (Simple Mail Transfer Protocol) est le protocole standard pour l'envoi (soumission et relais) d'emails. POP3 et IMAP sont utilisés par les clients pour récupérer les emails depuis le serveur.",
        category: "protocoles"
    },
    {
        question: "Quelle est la principale différence entre POP3 et IMAP pour la récupération d'emails ?",
        options: [
            "POP3 est plus sécurisé qu'IMAP", 
            "IMAP est plus ancien que POP3", 
            "POP3 télécharge (et supprime souvent) les emails du serveur, tandis qu'IMAP synchronise les emails et dossiers avec le serveur, permettant un accès depuis plusieurs appareils", 
            "POP3 utilise TCP, IMAP utilise UDP"
        ],
        correctAnswer: 2,
        explanation: "IMAP (Internet Message Access Protocol) est plus flexible que POP3 (Post Office Protocol 3) car il laisse les messages sur le serveur et synchronise l'état (lu/non lu, dossiers), ce qui est idéal pour un accès multi-appareils.",
        category: "protocoles"
    },
    {
        question: "Quel service Windows Server permet de déployer et gérer de manière centralisée les mises à jour Microsoft pour les ordinateurs d'un réseau ?",
        options: ["AD CS", "DFS", "WSUS", "Hyper-V"],
        correctAnswer: 2,
        explanation: "WSUS (Windows Server Update Services) permet aux administrateurs d'approuver et de distribuer les mises à jour Microsoft (Windows, Office, etc.) aux clients et serveurs internes, économisant la bande passante Internet et offrant plus de contrôle.",
        category: "windows-server"
    },
    {
        question: "Qu'est-ce que DFS (Distributed File System) dans Windows Server ?",
        options: [
            "Un système de fichiers spécifique pour les disques durs", 
            "Une technologie permettant de regrouper des partages de fichiers situés sur différents serveurs en un ou plusieurs espaces de noms logiques et de répliquer les données entre serveurs", 
            "Un protocole de sauvegarde réseau", 
            "Un outil de gestion des quotas de disque"
        ],
        correctAnswer: 1,
        explanation: "DFS simplifie l'accès aux ressources partagées pour les utilisateurs (via un espace de noms unifié) et peut améliorer la disponibilité et la répartition de charge grâce à la réplication (DFS-R).",
        category: "windows-server"
    },
    {
        question: "Quelle commande PowerShell permet d'obtenir de l'aide sur une autre commande (cmdlet) ?",
        options: ["Help-Command", "Get-Help", "Show-Help", "Info-Command"],
        correctAnswer: 1,
        explanation: "La cmdlet `Get-Help` est l'outil principal pour obtenir des informations sur l'utilisation d'autres cmdlets, y compris leur syntaxe, paramètres, et des exemples. Par exemple : `Get-Help Get-Process`.",
        category: "windows-server"
    },
    {
        question: "Quel type d'attaque consiste à injecter du code malveillant (souvent JavaScript) dans un site web pour qu'il s'exécute dans le navigateur d'autres utilisateurs ?",
        options: ["SQL Injection", "Cross-Site Scripting (XSS)", "DDoS", "Phishing"],
        correctAnswer: 1,
        explanation: "Le XSS exploite une vulnérabilité d'un site web qui ne valide ou n'échappe pas correctement les entrées utilisateur, permettant à un attaquant d'exécuter des scripts côté client pour voler des sessions, défigurer le site, ou rediriger les utilisateurs.",
        category: "securite"
    },
    {
        question: "Qu'est-ce qu'un WAF (Web Application Firewall) ?",
        options: [
            "Un pare-feu standard filtrant par ports et IP", 
            "Un pare-feu spécifiquement conçu pour protéger les applications web en filtrant et surveillant le trafic HTTP/S entre un client et un serveur web", 
            "Un système de détection d'intrusion réseau", 
            "Un type de VPN"
        ],
        correctAnswer: 1,
        explanation: "Un WAF se place devant les serveurs web pour analyser le trafic applicatif et bloquer les requêtes malveillantes comme les injections SQL, XSS, et autres attaques visant les vulnérabilités des applications web, ce qu'un pare-feu réseau traditionnel ne fait généralement pas.",
        category: "securite"
    },
    {
        question: "Quel est le principe de 'moindre privilège' (Principle of Least Privilege) en sécurité ?",
        options: [
            "Donner à tous les utilisateurs les mêmes privilèges minimaux", 
            "Accorder aux utilisateurs et processus uniquement les permissions strictement nécessaires pour accomplir leurs tâches légitimes, et rien de plus", 
            "Utiliser le moins de logiciels possible sur un système", 
            "Limiter le nombre de connexions réseau"
        ],
        correctAnswer: 1,
        explanation: "Ce principe fondamental de sécurité vise à limiter les dommages potentiels en cas de compromission d'un compte ou d'une erreur. Si un compte n'a que les droits nécessaires, un attaquant qui le contrôle aura un impact limité.",
        category: "securite"
    },
    {
        question: "Quelle est la différence principale entre une sauvegarde incrémentielle et une sauvegarde différentielle ?",
        options: [
            "Incrémentielle sauvegarde tout, différentielle seulement les changements", 
            "Différentielle est plus rapide à sauvegarder", 
            "Incrémentielle sauvegarde les fichiers modifiés depuis la DERNIÈRE sauvegarde (quelle qu'elle soit), différentielle sauvegarde les fichiers modifiés depuis la DERNIÈRE sauvegarde COMPLÈTE", 
            "Incrémentielle nécessite plus d'espace de stockage"
        ],
        correctAnswer: 2,
        explanation: "Sauvegarde Incrémentielle : rapide, faible espace, mais restauration plus longue (dernière complète + toutes les incrémentielles). Sauvegarde Différentielle : plus longue et plus gourmande en espace que l'incrémentielle au fil du temps, mais restauration plus rapide (dernière complète + dernière différentielle).",
        category: "continuite"
    },
    {
        question: "Quel niveau RAID offre une redondance par parité distribuée sur plusieurs disques, permettant la défaillance d'un disque sans perte de données ?",
        options: ["RAID 0", "RAID 1", "RAID 5", "RAID 10"],
        correctAnswer: 2,
        explanation: "RAID 5 utilise le striping avec parité distribuée. Il nécessite au moins 3 disques. La parité permet de reconstruire les données d'un disque défaillant à partir des informations des autres disques. RAID 1 est la mise en miroir, RAID 0 est le striping sans redondance, RAID 10 combine striping et miroir.",
        category: "continuite"
    },
    {
        question: "Quelle commande est utilisée sur un switch Cisco pour assigner un port à un VLAN spécifique (en mode accès) ?",
        options: ["interface vlan [vlan-id]", "switchport mode trunk", "switchport access vlan [vlan-id]", "spanning-tree portfast"],
        correctAnswer: 2,
        explanation: "Après être entré dans la configuration de l'interface (ex: `interface FastEthernet0/1`), la commande `switchport mode access` définit le port comme port d'accès, et `switchport access vlan [vlan-id]` l'assigne au VLAN spécifié.",
        category: "cisco-routers" // Applicable aux switchs Cisco
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
        
        // --- NEW: Shuffle options ---
        // 1. Create array of options with their original index
        const optionsWithIndices = question.options.map((text, index) => ({ 
            text: text, 
            originalIndex: index 
        }));
        
        // 2. Shuffle this array
        const shuffledOptions = shuffleArray(optionsWithIndices);
        // --- End NEW ---

        // Add new options (iterate through shuffled options)
        shuffledOptions.forEach(optionData => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'quiz-option p-4 bg-darker rounded-lg cursor-pointer hover:bg-primary hover:text-white transition-colors';
            optionDiv.textContent = optionData.text; // Use text from shuffled object
            // Store the ORIGINAL index in the dataset
            optionDiv.dataset.originalIndex = optionData.originalIndex; 
            
            optionDiv.addEventListener('click', function() {
                // Pass the element itself to selectOption
                selectOption(this); 
            });
            
            quizOptions.appendChild(optionDiv);
        });
        
        // Disable next button until an option is selected
        quizNextBtn.disabled = true;
    }
    
    function selectOption(optionElement) { // Receive the clicked element
        // Get the original index from the dataset
        const selectedOriginalIndex = parseInt(optionElement.dataset.originalIndex, 10); 
        
        const question = currentQuizQuestions[currentQuestionIndex];
        const isCorrect = selectedOriginalIndex === question.correctAnswer;
        
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
            // Find the element corresponding to the correct answer's original index
            allOptions.forEach(opt => {
                if (parseInt(opt.dataset.originalIndex, 10) === question.correctAnswer) {
                    opt.classList.remove('bg-darker');
                    opt.classList.add('bg-green-600', 'text-white');
                }
            });
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
        
        // Record user's answer using the ORIGINAL index
        userAnswers.push({
            question: question.question,
            userAnswerIndex: selectedOriginalIndex, // Store the original index of the chosen answer
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