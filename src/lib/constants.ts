// Site configuration
export const SITE_CONFIG = {
  name: "Take The Next Step 121",
  shortName: "TTNTS121",
  tagline: "Football Fun That Builds Confidence",
  description:
    "Fun, professional football coaching for children ages 4-11 in Luton, Barton Le Clay & Silsoe. FA qualified coaches, DBS checked. Book your session today.",
  phone: "07392756909",
  email: "takethenextstep121@gmail.com",
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
    address: "Ramsey Manor Lower School, Barton Le Clay, Bedfordshire",
    postcode: "MK45 4RE",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2456.8!2d-0.4339!3d51.9605!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4876336f78e7c5d1%3A0x33ee2d8c5d8c9d67!2sRamsey%20Manor%20Lower%20School!5e0!3m2!1sen!2suk!4v1705000000000!5m2!1sen!2suk",
    parkingInfo: "School car park available. Please use the main entrance.",
    venueName: "Ramsey Manor Lower School",
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

// Services - the main service offerings (for dropdown and service pages)
export const SERVICES = [
  {
    id: "one-to-one",
    name: "1:1 Coaching",
    slug: "one-to-one",
    shortDescription: "Private sessions with dedicated attention",
    description:
      "Personalised coaching with 100% focus on one player. Perfect for building confidence, developing specific skills, or preparing for trials.",
    priceDisplay: "From £35/hour",
    icon: "user",
    features: [
      "Dedicated coach attention",
      "Customised training plan",
      "Flexible scheduling",
      "Progress tracking",
    ],
  },
  {
    id: "group-sessions",
    name: "Group Sessions",
    slug: "group-sessions",
    shortDescription: "Drop-in sessions for football fun with friends",
    description:
      "Open sessions anyone can join. Great for making friends, building teamwork, and enjoying football in a relaxed environment.",
    priceDisplay: "£6/session",
    icon: "users",
    features: [
      "Drop-in flexibility",
      "Make new friends",
      "All abilities welcome",
      "Fun-focused coaching",
    ],
  },
  {
    id: "half-term-camps",
    name: "Half Term Camps",
    slug: "half-term-camps",
    shortDescription: "Action-packed football fun during school breaks",
    description:
      "A week of football, friendships, and fun. Childcare sorted while kids have the time of their lives.",
    priceDisplay: "From £20/day",
    icon: "tent",
    features: [
      "Full day camps",
      "All abilities welcome",
      "Lunch supervision",
      "Skill competitions",
    ],
  },
  {
    id: "birthday-parties",
    name: "Birthday Parties",
    slug: "birthday-parties",
    shortDescription: "Unforgettable football birthday celebrations",
    description:
      "Give your child the ultimate football party. Professional coaches, exciting games, medals, and memories that last forever.",
    priceDisplay: "Call to discuss",
    icon: "party-popper",
    features: [
      "Venue or mobile options",
      "Medals & certificates",
      "Party bags available",
      "Professional coaches",
    ],
  },
  {
    id: "after-school-clubs",
    name: "After School Clubs",
    slug: "after-school-clubs",
    shortDescription: "Weekly football clubs at local schools",
    description:
      "The perfect mid-week energy release that fits around work schedules.",
    priceDisplay: "£6/session",
    icon: "school",
    features: [
      "Weekly during term time",
      "School pickup convenience",
      "Age-appropriate groups",
      "Progress reports",
    ],
  },
];

// 1:1 Coaching packages
export const ONE_TO_ONE_PACKAGES = [
  {
    id: "single",
    name: "Single Session",
    sessions: 1,
    pricePerSession: 40,
    totalPrice: 40,
    description: "Try a session to see if 1:1 coaching is right for your child.",
  },
  {
    id: "starter",
    name: "Starter Pack",
    sessions: 4,
    pricePerSession: 37.50,
    totalPrice: 150,
    savings: 10,
    description: "Perfect for focused skill development over a month.",
    popular: true,
  },
  {
    id: "development",
    name: "Development Pack",
    sessions: 8,
    pricePerSession: 35,
    totalPrice: 280,
    savings: 40,
    description: "Ideal for comprehensive skill building and confidence.",
  },
];

// Birthday party options
export const PARTY_OPTIONS = {
  venueTypes: [
    {
      id: "venue",
      name: "At Our Venue",
      description: "Host at one of our partner venues with all equipment provided.",
    },
    {
      id: "mobile",
      name: "We Come to You",
      description: "We bring the party to your chosen location - park, garden, or sports facility.",
    },
  ],
  inclusions: [
    "Professional FA-qualified coach",
    "1.5-2 hours of football activities",
    "Fun games and mini tournaments",
    "Medals for all participants",
    "Winner's trophy",
    "Party bags (optional)",
    "All equipment provided",
  ],
  ageRange: "4-11 years",
  maxChildren: 20,
  minChildren: 8,
};

// Session types (updated for booking form - includes all bookable types)
export const SESSION_TYPES = [
  {
    id: "after-school",
    name: "After School Club",
    description: "The perfect mid-week energy release that fits around work schedules.",
    duration: "1 hour",
    ageRange: "4-11",
    frequency: "Weekly during term time",
    priceFrom: 6,
    category: "regular",
  },
  {
    id: "group-session",
    name: "Group Session",
    description: "Drop-in sessions for football fun. Great for making friends and enjoying football.",
    duration: "1 hour",
    ageRange: "4-11",
    frequency: "Weekly",
    priceFrom: 6,
    category: "regular",
  },
  {
    id: "half-term",
    name: "Half Term Camp",
    description: "A week of football, friendships, and fun. Childcare sorted while kids have the time of their lives.",
    duration: "Half or full day",
    ageRange: "4-11",
    frequency: "Half-term holidays",
    priceFrom: 20,
    category: "camp",
  },
  {
    id: "one-to-one",
    name: "1:1 Coaching",
    description: "Private coaching sessions with dedicated attention and a customised plan.",
    duration: "1 hour",
    ageRange: "4-11",
    frequency: "Flexible scheduling",
    priceFrom: 35,
    category: "private",
  },
  {
    id: "birthday-party",
    name: "Birthday Party",
    description: "The ultimate football birthday celebration with professional coaching and all the extras.",
    duration: "1.5-2 hours",
    ageRange: "4-11",
    frequency: "By arrangement",
    priceFrom: null, // Call to discuss
    category: "party",
  },
];

// Age groups
export const AGE_GROUPS = [
  {
    id: "mini-kickers",
    name: "Mini Kickers",
    ageRange: "4-5",
    focus: "First football memories! Gentle games, lots of encouragement, and celebrations for every kick.",
  },
  {
    id: "juniors",
    name: "Juniors",
    ageRange: "6-7",
    focus: "Building real skills through fun games. Kids start understanding teamwork and grow in confidence.",
  },
  {
    id: "seniors",
    name: "Seniors",
    ageRange: "8-9",
    focus: "Technique gets serious (but still fun!). Mini matches, tactical basics, and club-ready skills.",
  },
  {
    id: "advanced",
    name: "Advanced",
    ageRange: "10-11",
    focus: "For kids who live and breathe football. Advanced skills, proper matches, and pathways to local clubs.",
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

// Navigation - Sessions removed, Services dropdown handled in Header component
export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/contact", label: "Contact" },
];

// About Us dropdown navigation
export const ABOUT_NAV = [
  { href: "/about", label: "About Us" },
  { href: "/locations", label: "Locations" },
  { href: "/schools", label: "Schools" },
];

// Services navigation items (for dropdown)
export const SERVICES_NAV = SERVICES.map((service) => ({
  href: `/services/${service.slug}`,
  label: service.name,
}));

// Alias for service types (used in session filtering)
export const SERVICE_TYPES = SESSION_TYPES;
