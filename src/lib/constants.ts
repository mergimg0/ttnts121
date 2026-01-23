// Site configuration
export const SITE_CONFIG = {
  name: "Take The Next Step 121",
  shortName: "TTNTS121",
  tagline: "Football Fun That Builds Confidence",
  description:
    "Fun, professional football coaching for children ages 4-11 in Luton, Barton Le Clay & Silsoe. FA qualified coaches, DBS checked. Book your session today.",
  phone: "07XXX XXXXXX", // Update with real number
  email: "info@takethenextstep121.co.uk",
  instagram: "https://instagram.com/takethenextstep121",
  facebook: "https://facebook.com/takethenextstep121",
};

// Locations
export const LOCATIONS = [
  {
    id: "luton",
    name: "Luton",
    address: "Luton, Bedfordshire",
    postcode: "LU1",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d39174.8776!2d-0.4500!3d51.8787!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4876387b2c8c1d8d%3A0x753ad3d2c6c6a88c!2sLuton!5e0!3m2!1sen!2suk!4v1705000000000!5m2!1sen!2suk",
    parkingInfo: "Free parking available at the venue.",
  },
  {
    id: "barton-le-clay",
    name: "Barton Le Clay",
    address: "Barton Le Clay, Bedfordshire",
    postcode: "MK45",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9836.5!2d-0.4339!3d51.9605!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4876336f78e7c5d1%3A0x33ee2d8c5d8c9d67!2sBarton-le-Clay!5e0!3m2!1sen!2suk!4v1705000000000!5m2!1sen!2suk",
    parkingInfo: "Village hall car park available.",
  },
  {
    id: "silsoe",
    name: "Silsoe",
    address: "Silsoe, Bedfordshire",
    postcode: "MK45",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4918.2!2d-0.4287!3d52.0084!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487630f9c7b7b7b7%3A0x5a5a5a5a5a5a5a5a!2sSilsoe!5e0!3m2!1sen!2suk!4v1705000000000!5m2!1sen!2suk",
    parkingInfo: "Street parking available nearby.",
  },
];

// Session types
export const SESSION_TYPES = [
  {
    id: "after-school",
    name: "After School Club",
    description: "Weekly sessions during term time, perfect for regular development.",
    duration: "1 hour",
    ageRange: "4-11",
    frequency: "Weekly during term time",
    priceFrom: 6,
  },
  {
    id: "half-term",
    name: "Half Term Camp",
    description: "Multi-day camps during school half terms, packed with football fun.",
    duration: "Half or full day",
    ageRange: "4-11",
    frequency: "Half-term holidays",
    priceFrom: 20,
  },
  {
    id: "holiday",
    name: "Holiday Camp",
    description: "Extended holiday camps during Easter and Summer breaks.",
    duration: "Full day",
    ageRange: "4-11",
    frequency: "School holidays",
    priceFrom: 25,
  },
];

// Age groups
export const AGE_GROUPS = [
  {
    id: "mini-kickers",
    name: "Mini Kickers",
    ageRange: "4-5",
    focus: "Fun introduction to football through games and basic coordination.",
  },
  {
    id: "juniors",
    name: "Juniors",
    ageRange: "6-7",
    focus: "Building fundamental skills while keeping the fun element central.",
  },
  {
    id: "seniors",
    name: "Seniors",
    ageRange: "8-9",
    focus: "Developing technique and introducing tactical awareness.",
  },
  {
    id: "advanced",
    name: "Advanced",
    ageRange: "10-11",
    focus: "Advanced skills, game play, and preparing for club football.",
  },
];

// Payment options
export const PAYMENT_OPTIONS = [
  {
    id: "bank",
    name: "Bank Transfer",
    description: "Pay directly to our bank account. Details will be sent after booking.",
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Quick and easy payment via PayPal.me link.",
  },
  {
    id: "cash",
    name: "Cash on Arrival",
    description: "Pay in person at the start of the session. Please bring exact change.",
  },
];

// Trust badges / credentials
export const CREDENTIALS = [
  { icon: "shield-check", text: "FA Qualified Coaches" },
  { icon: "badge-check", text: "DBS Checked" },
  { icon: "file-shield", text: "Fully Insured" },
  { icon: "heart", text: "First Aid Trained" },
];

// Navigation
export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/sessions", label: "Sessions" },
  { href: "/locations", label: "Locations" },
  { href: "/about", label: "About Us" },
  { href: "/schools", label: "Schools" },
  { href: "/contact", label: "Contact" },
];
