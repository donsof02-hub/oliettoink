// Add loading animation for images
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        // Set initial opacity for fade-in effect
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        // If image is already loaded
        if (img.complete) {
            img.style.opacity = '1';
        }
    });

    // Cura del Tatuaggio navigation
    const curaLink = document.getElementById('curaLink');
    const mainLinks = document.getElementById('mainLinks');
    const curaSection = document.getElementById('curaSection');
    const backButton = document.getElementById('backButton');
    const profileSection = document.querySelector('.profile-section');
    const footer = document.querySelector('.footer');

    if (curaLink && curaSection && backButton) {
        curaLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Hide main content
            mainLinks.style.display = 'none';
            profileSection.style.display = 'none';
            footer.style.display = 'none';
            // Show cura section
            curaSection.style.display = 'block';
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Show main content
            mainLinks.style.display = 'flex';
            profileSection.style.display = 'block';
            footer.style.display = 'block';
            // Hide cura section
            curaSection.style.display = 'none';
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
