import fs from 'fs';
import path from 'path';

const tableMap = {
    "admin_messages": "c_admin_messages",
    "categories": "c_categories",
    "communities": "c_communities",
    "community_categories": "c_community_categories",
    "documents": "c_documents",
    "events": "c_events",
    "lessons": "c_lessons",
    "modules": "c_modules",
    "navbar_links": "c_navbar_links",
    "notifications": "c_notifications",
    "post_likes": "c_post_likes",
    "posts": "c_posts",
    "profiles": "c_profiles",
    "reports": "c_reports",
    "trending_settings": "c_trending_settings",
    "useful_links": "c_external_links",
    "user_rankings": "c_user_rankings",
    "user_roles": "c_user_roles"
};

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            let changed = false;

            // Regex to find .from('table') or .from("table") or .from(`table`)
            const regex = /\.from\(\s*['"`]([a-zA-Z0-9_]+)['"`]\s*\)/g;

            content = content.replace(regex, (match, tableName) => {
                if (tableMap[tableName]) {
                    changed = true;
                    // Only replace the table name itself inside the match
                    return match.replace(tableName, tableMap[tableName]);
                }
                return match;
            });

            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf-8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDirectory('./src');
console.log('Update finished.');
