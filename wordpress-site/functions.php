<?php
/**
 * Suite E Studios — Theme functions
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// ---------------------------------------------------------------
// Theme supports
// ---------------------------------------------------------------
add_action( 'after_setup_theme', function () {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'editor-styles' );
    add_theme_support( 'wp-block-styles' );
    add_theme_support( 'align-wide' );
    add_theme_support( 'responsive-embeds' );
    add_theme_support( 'html5', [
        'search-form', 'comment-form', 'comment-list',
        'gallery', 'caption', 'style', 'script',
    ] );

    register_nav_menus( [
        'primary' => __( 'Primary Navigation', 'suite-e-studios' ),
    ] );
} );

// ---------------------------------------------------------------
// Enqueue Google Fonts (Inter) + theme stylesheet
// ---------------------------------------------------------------
add_action( 'wp_enqueue_scripts', function () {
    // Inter from Google Fonts — weights 400, 500, 700, 900
    wp_enqueue_style(
        'suite-e-google-fonts',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap',
        [],
        null
    );

    // Main theme stylesheet
    wp_enqueue_style(
        'suite-e-style',
        get_stylesheet_uri(),
        [ 'suite-e-google-fonts' ],
        wp_get_theme()->get( 'Version' )
    );
} );

// Also enqueue Inter in the block editor
add_action( 'enqueue_block_editor_assets', function () {
    wp_enqueue_style(
        'suite-e-google-fonts-editor',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap',
        [],
        null
    );
} );

// ---------------------------------------------------------------
// Preconnect to Google Fonts for performance
// ---------------------------------------------------------------
add_action( 'wp_head', function () {
    echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
    echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
}, 1 );

// ---------------------------------------------------------------
// SEO — optimized page title
// ---------------------------------------------------------------
add_filter( 'pre_get_document_title', function () {
    return 'Suite E Studios | DIY Music Venue &amp; Creative Space | St. Pete, FL';
} );

// ---------------------------------------------------------------
// SEO — meta description, Open Graph, Twitter Card
// ---------------------------------------------------------------
add_action( 'wp_head', function () {
    $url         = 'https://suiteestudios.com';
    $title       = 'Suite E Studios | DIY Music Venue &amp; Creative Space | St. Pete, FL';
    $description = 'Suite E Studios is St. Pete\'s DIY music venue &amp; creative community space tucked inside the Warehouse Arts District. Live music, art shows, vinyl nights, and creative events in St. Petersburg, FL.';
    $image       = 'https://suiteestudios.com/wp-content/uploads/2026/04/cropped-Suite-E-Studios-Logo-Vector.png';

    echo '<meta name="description" content="' . esc_attr( $description ) . '">' . "\n";
    echo '<meta name="keywords" content="music venue St Pete, creative space St Petersburg FL, DIY venue, live music St Pete, Warehouse Arts District, community space, art shows, vinyl nights, St Petersburg Florida">' . "\n";
    echo '<link rel="canonical" href="' . esc_url( $url ) . '">' . "\n";

    // Open Graph
    echo '<meta property="og:type" content="website">' . "\n";
    echo '<meta property="og:url" content="' . esc_url( $url ) . '">' . "\n";
    echo '<meta property="og:title" content="' . esc_attr( $title ) . '">' . "\n";
    echo '<meta property="og:description" content="' . esc_attr( $description ) . '">' . "\n";
    echo '<meta property="og:image" content="' . esc_url( $image ) . '">' . "\n";
    echo '<meta property="og:locale" content="en_US">' . "\n";
    echo '<meta property="og:site_name" content="Suite E Studios">' . "\n";

    // Twitter Card
    echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
    echo '<meta name="twitter:title" content="' . esc_attr( $title ) . '">' . "\n";
    echo '<meta name="twitter:description" content="' . esc_attr( $description ) . '">' . "\n";
    echo '<meta name="twitter:image" content="' . esc_url( $image ) . '">' . "\n";
}, 2 );

// ---------------------------------------------------------------
// SEO — LocalBusiness + MusicVenue JSON-LD schema
// ---------------------------------------------------------------
add_action( 'wp_head', function () {
    $schema = [
        '@context' => 'https://schema.org',
        '@type'    => [ 'MusicVenue', 'EventVenue', 'LocalBusiness' ],
        'name'     => 'Suite E Studios',
        'description' => 'DIY community music venue and creative space in St. Petersburg, FL\'s Warehouse Arts District. Live music, art shows, vinyl nights, workshops, and creative events.',
        'url'      => 'https://suiteestudios.com',
        'email'    => 'info@suiteestudios.com',
        'logo'     => 'https://suiteestudios.com/wp-content/uploads/2026/04/cropped-Suite-E-Studios-Logo-Vector.png',
        'image'    => 'https://suiteestudios.com/wp-content/uploads/2026/04/cropped-Suite-E-Studios-Logo-Vector.png',
        'address'  => [
            '@type'           => 'PostalAddress',
            'streetAddress'   => '615 27th St S STE E',
            'addressLocality' => 'St. Petersburg',
            'addressRegion'   => 'FL',
            'postalCode'      => '33712',
            'addressCountry'  => 'US',
        ],
        'geo' => [
            '@type'     => 'GeoCoordinates',
            'latitude'  => 27.7549,
            'longitude' => -82.6695,
        ],
        'hasMap'     => 'https://maps.google.com/?q=615+27th+St+S+STE+E,+St.+Petersburg,+FL+33712',
        'priceRange' => '$',
        'currenciesAccepted' => 'USD',
        'paymentAccepted'    => 'Cash, Credit Card',
        'areaServed' => [
            '@type' => 'City',
            'name'  => 'St. Petersburg',
            'containedInPlace' => [
                '@type' => 'State',
                'name'  => 'Florida',
            ],
        ],
        'sameAs' => [
            'https://instagram.com/suite.e.studios',
            'https://www.facebook.com/suite.e.stpete',
            'https://youtube.com/@StPeteMusic',
            'https://www.patreon.com/suiteestudios',
        ],
        'keywords' => 'music venue, creative space, DIY venue, live music, art shows, vinyl nights, St. Petersburg FL, Warehouse Arts District, community space',
    ];

    echo '<script type="application/ld+json">' . "\n";
    echo wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT );
    echo "\n" . '</script>' . "\n";
}, 10 );

// ---------------------------------------------------------------
// Favicon
// ---------------------------------------------------------------
add_action( 'wp_head', function () {
    echo '<link rel="icon" type="image/png" href="https://suiteestudios.com/wp-content/uploads/2026/04/cropped-Suite-E-Studios-Logo-Vector-White.png">' . "\n";
    echo '<link rel="apple-touch-icon" href="https://suiteestudios.com/wp-content/uploads/2026/04/cropped-Suite-E-Studios-Logo-Vector-White.png">' . "\n";
}, 1 );

// ---------------------------------------------------------------
// Allow SVG uploads in the Media Library
// ---------------------------------------------------------------
add_filter( 'upload_mimes', function ( $mimes ) {
    $mimes['svg']  = 'image/svg+xml';
    $mimes['svgz'] = 'image/svg+xml';
    return $mimes;
} );
