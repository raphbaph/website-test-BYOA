const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');

// Add this function to check required files and directories
function checkRequiredFiles() {
    const required = [
        'src/templates/base.html',
        'src/templates/blog-post.html',
        'src/templates/blog-index.html',
        'src/content/pages/index.md'
    ];

    required.forEach(file => {
        if (!fs.existsSync(file)) {
            console.error(`ERROR: Required file ${file} not found!`);
            process.exit(1);
        } else {
            console.log(`✓ Found ${file}`);
        }
    });
}

// Create build directory
fs.ensureDirSync('dist');

// Copy static assets
if (fs.existsSync('src/public')) {
    fs.copySync('src/public', 'dist');
    console.log('✓ Copied static assets');
}

// Read template
const templatePath = path.join(__dirname, '../src/templates/base.html');
console.log('Reading template from:', templatePath);
const template = fs.readFileSync(templatePath, 'utf-8');

// Build pages
function buildPages() {
    const pagesDir = path.join(__dirname, '../src/content/pages');
    console.log('Looking for pages in:', pagesDir);
    
    if (!fs.existsSync(pagesDir)) {
        console.error('Pages directory not found:', pagesDir);
        return;
    }

    const files = fs.readdirSync(pagesDir);
    console.log('Found files:', files);
    
    files.forEach(file => {
        if (file === 'index.md') {
            // Handle index.html separately but keep nav and footer
            const filePath = path.join(pagesDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const { attributes, body } = frontMatter(content);
            const htmlContent = marked(body);
            
            // Extract nav and footer from template
            const nav = template.match(/<nav>[\s\S]*?<\/nav>/)[0];
            const footer = template.match(/<footer>[\s\S]*?<\/footer>/)[0];
            
            const indexPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${attributes.title || 'Home'}</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    ${nav}
    <main>
        ${htmlContent}
    </main>
    ${footer}
</body>
</html>`;
            
            const outputPath = path.join(__dirname, '../dist/index.html');
            fs.writeFileSync(outputPath, indexPage);
            console.log('✓ Created:', outputPath);
        } else if (file.endsWith('.md')) {
            // Handle other pages with the template
            const filePath = path.join(pagesDir, file);
            console.log('Processing:', filePath);
            
            const content = fs.readFileSync(filePath, 'utf-8');
            const { attributes, body } = frontMatter(content);
            const htmlContent = marked(body);
            
            const page = template
                .replace('{{title}}', attributes.title || 'My Site')
                .replace('{{content}}', htmlContent);
            
            const outputPath = path.join(__dirname, '../dist', file.replace('.md', '.html'));
            fs.writeFileSync(outputPath, page);
            console.log('✓ Created:', outputPath);
        }
    });
}

// Add these functions after the existing imports
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Update the buildBlog function
function buildBlog() {
    const blogDir = path.join(__dirname, '../src/content/blog');
    const blogTemplate = fs.readFileSync(path.join(__dirname, '../src/templates/blog-post.html'), 'utf-8');
    const blogIndexTemplate = fs.readFileSync(path.join(__dirname, '../src/templates/blog-index.html'), 'utf-8');
    
    console.log('Looking for blog posts in:', blogDir);
    
    if (!fs.existsSync(blogDir)) {
        console.error('Blog directory not found:', blogDir);
        return;
    }

    const files = fs.readdirSync(blogDir);
    const posts = [];
    
    // Process each blog post
    files.forEach(file => {
        if (file.endsWith('.md')) {
            const filePath = path.join(blogDir, file);
            console.log('Processing:', filePath);
            
            const content = fs.readFileSync(filePath, 'utf-8');
            const { attributes, body } = frontMatter(content);
            const htmlContent = marked(body);
            
            // Store post data for the index
            posts.push({
                title: attributes.title,
                date: attributes.date,
                slug: file.replace('.md', ''),
                excerpt: attributes.excerpt || body.split('\n')[0]
            });
            
            // Create individual blog post
            const page = blogTemplate
                .replace('{{title}}', attributes.title || 'Blog Post')
                .replace('{{date}}', attributes.date)
                .replace('{{formattedDate}}', formatDate(attributes.date))
                .replace('{{content}}', htmlContent);
            
            const outputPath = path.join(__dirname, '../dist/blog', file.replace('.md', '.html'));
            fs.ensureDirSync(path.join(__dirname, '../dist/blog'));
            fs.writeFileSync(outputPath, page);
            console.log('✓ Created:', outputPath);
        }
    });
    
    // Sort posts by date
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Create blog index page
    const postListHTML = posts.map(post => `
        <div class="post-preview">
            <h2><a href="/blog/${post.slug}.html">${post.title}</a></h2>
            <time datetime="${post.date}">${formatDate(post.date)}</time>
            <p>${post.excerpt}</p>
        </div>
    `).join('');
    
    const indexPage = blogIndexTemplate.replace('{{posts}}', postListHTML);
    const indexPath = path.join(__dirname, '../dist/blog/index.html');
    fs.writeFileSync(indexPath, indexPage);
    console.log('✓ Created blog index:', indexPath);
}

try {
    console.log('Starting build process...');
    checkRequiredFiles();
    buildPages();
    buildBlog();
    
    // Verify the output
    if (fs.existsSync('dist/index.html')) {
        console.log('✓ Successfully created dist/index.html');
    } else {
        console.error('ERROR: Failed to create dist/index.html');
    }
    
    console.log('Site built successfully!');
} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}