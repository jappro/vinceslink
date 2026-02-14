// Terms & Conditions Popup
document.addEventListener(‘DOMContentLoaded’, function() {
const popup = document.getElementById(‘termsPopup’);
const acceptBtn = document.getElementById(‘acceptBtn’);
const rejectBtn = document.getElementById(‘rejectBtn’);

```
// Check if user has already seen the popup
const hasAccepted = localStorage.getItem('vinceslinkTermsAccepted');

if (!hasAccepted) {
    setTimeout(() => {
        popup.classList.add('active');
    }, 500);
}

acceptBtn.addEventListener('click', function() {
    localStorage.setItem('vinceslinkTermsAccepted', 'true');
    popup.classList.remove('active');
});

rejectBtn.addEventListener('click', function() {
    localStorage.setItem('vinceslinkTermsAccepted', 'rejected');
    popup.classList.remove('active');
});
```

});

// Mobile Menu Toggle
const menuToggle = document.getElementById(‘menuToggle’);
const navMenu = document.getElementById(‘navMenu’);

menuToggle.addEventListener(‘click’, function() {
navMenu.classList.toggle(‘active’);

```
// Animate hamburger icon
const spans = menuToggle.querySelectorAll('span');
if (navMenu.classList.contains('active')) {
    spans[0].style.transform = 'rotate(45deg) translate(7px, 7px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
} else {
    spans[0].style.transform = 'none';
    spans[1].style.opacity = '1';
    spans[2].style.transform = 'none';
}
```

});

// Close mobile menu when clicking on a link
document.querySelectorAll(’.nav-link’).forEach(link => {
link.addEventListener(‘click’, function() {
navMenu.classList.remove(‘active’);
const spans = menuToggle.querySelectorAll(‘span’);
spans[0].style.transform = ‘none’;
spans[1].style.opacity = ‘1’;
spans[2].style.transform = ‘none’;
});
});

// Carousel Functionality
const carouselTrack = document.getElementById(‘carouselTrack’);
const carouselItems = document.querySelectorAll(’.carousel-item’);
const prevBtn = document.getElementById(‘prevBtn’);
const nextBtn = document.getElementById(‘nextBtn’);
const dotsContainer = document.getElementById(‘carouselDots’);

let currentIndex = 0;
const totalItems = carouselItems.length;
let autoSlideInterval;

// Create dots
for (let i = 0; i < totalItems; i++) {
const dot = document.createElement(‘div’);
dot.classList.add(‘carousel-dot’);
if (i === 0) dot.classList.add(‘active’);
dot.addEventListener(‘click’, () => goToSlide(i));
dotsContainer.appendChild(dot);
}

const dots = document.querySelectorAll(’.carousel-dot’);

function updateCarousel() {
carouselTrack.style.transform = `translateX(-${currentIndex * 100}%)`;

```
// Update dots
dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentIndex);
});
```

}

function goToSlide(index) {
currentIndex = index;
updateCarousel();
resetAutoSlide();
}

function nextSlide() {
currentIndex = (currentIndex + 1) % totalItems;
updateCarousel();
}

function prevSlide() {
currentIndex = (currentIndex - 1 + totalItems) % totalItems;
updateCarousel();
}

function startAutoSlide() {
autoSlideInterval = setInterval(nextSlide, 4000); // Slide every 4 seconds
}

function resetAutoSlide() {
clearInterval(autoSlideInterval);
startAutoSlide();
}

// Event Listeners
nextBtn.addEventListener(‘click’, () => {
nextSlide();
resetAutoSlide();
});

prevBtn.addEventListener(‘click’, () => {
prevSlide();
resetAutoSlide();
});

// Start auto-slide
startAutoSlide();

// Pause auto-slide on hover
const carouselContainer = document.querySelector(’.carousel-container’);
carouselContainer.addEventListener(‘mouseenter’, () => {
clearInterval(autoSlideInterval);
});

carouselContainer.addEventListener(‘mouseleave’, () => {
startAutoSlide();
});

// FAQ Accordion
const faqQuestions = document.querySelectorAll(’.faq-question’);

faqQuestions.forEach(question => {
question.addEventListener(‘click’, function() {
const faqItem = this.parentElement;
const isActive = faqItem.classList.contains(‘active’);

```
    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Open clicked item if it wasn't active
    if (!isActive) {
        faqItem.classList.add('active');
    }
});
```

});

// Newsletter Subscription
const subscribeBtn = document.getElementById(‘subscribeBtn’);
const newsletterEmail = document.getElementById(‘newsletterEmail’);

subscribeBtn.addEventListener(‘click’, function() {
const email = newsletterEmail.value.trim();

```
if (email === '') {
    alert('Please enter your email address');
    return;
}

// Basic email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    alert('Please enter a valid email address');
    return;
}

// TODO: In production, send email to backend
alert('Thank you for subscribing to our newsletter! 🎉');
newsletterEmail.value = '';
```

});

// Enter key for newsletter
newsletterEmail.addEventListener(‘keypress’, function(e) {
if (e.key === ‘Enter’) {
subscribeBtn.click();
}
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll(‘a[href^=”#”]’).forEach(anchor => {
anchor.addEventListener(‘click’, function(e) {
e.preventDefault();
const target = document.querySelector(this.getAttribute(‘href’));
if (target) {
const offset = 80; // Account for fixed navbar
const targetPosition = target.offsetTop - offset;
window.scrollTo({
top: targetPosition,
behavior: ‘smooth’
});
}
});
});

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector(’.navbar’);

window.addEventListener(‘scroll’, function() {
const currentScroll = window.pageYOffset;

```
if (currentScroll > 100) {
    navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
} else {
    navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
}

lastScroll = currentScroll;
```

});

// Load images with error handling
function loadImage(imgElement, src) {
imgElement.onerror = function() {
// Create a placeholder with gradient
const canvas = document.createElement(‘canvas’);
canvas.width = 800;
canvas.height = 600;
const ctx = canvas.getContext(‘2d’);

```
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0019A8');
    gradient.addColorStop(1, '#20B2AA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Vinceslink', canvas.width / 2, canvas.height / 2);
    
    this.src = canvas.toDataURL();
};
imgElement.src = src;
```

}

// Initialize images
document.addEventListener(‘DOMContentLoaded’, function() {
// Load carousel placeholder images
const carouselImages = document.querySelectorAll(’.carousel-img’);
carouselImages.forEach((img, index) => {
const placeholders = [
‘placeholder-charger.jpg’,
‘placeholder-headset.jpg’,
‘placeholder-icecream.jpg’,
‘placeholder-cosmetics.jpg’,
‘placeholder-land.jpg’,
‘placeholder-house.jpg’
];
loadImage(img, placeholders[index]);
});
});
