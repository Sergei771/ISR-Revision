// Script pour ajouter une barre de navigation mobile
document.addEventListener('DOMContentLoaded', function() {
    // Créer l'élément de navigation pour mobile
    const mobileNav = document.createElement('div');
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
}); 