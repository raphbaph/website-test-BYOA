const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');

// Add this function to check required files and directories
function checkRequiredFiles() {
    const required = [
        'src/templates/base.html',
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
        if (file.endsWith('.md')) {
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

// Build blog posts
function buildBlog() {
    const blogDir = path.join(__dirname, '../src/content/blog');
    console.log('Looking for blog posts in:', blogDir);
    
    if (!fs.existsSync(blogDir)) {
        console.error('Blog directory not found:', blogDir);
        return;
    }

    const files = fs.readdirSync(blogDir);
    
    files.forEach(file => {
        if (file.endsWith('.md')) {
            const filePath = path.join(blogDir, file);
            console.log('Processing:', filePath);
            
            const content = fs.readFileSync(filePath, 'utf-8');
            const { attributes, body } = frontMatter(content);
            const htmlContent = marked(body);
            
            const page = template
                .replace('{{title}}', attributes.title || 'Blog Post')
                .replace('{{content}}', htmlContent);
            
            const outputPath = path.join(__dirname, '../dist/blog', file.replace('.md', '.html'));
            fs.ensureDirSync(path.join(__dirname, '../dist/blog'));
            fs.writeFileSync(outputPath, page);
            console.log('✓ Created:', outputPath);
        }
    });
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