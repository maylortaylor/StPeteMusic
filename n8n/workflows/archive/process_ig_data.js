const fs = require('fs');

// Path to the CSV file
const csvFilePath = '/Users/matttaylor/Documents/_dev/n8n/StPeteMusic - IG data/Sheets/Post Scheduling Sheet _ StPeteMusic - IG_PastPosts.csv';

function parseCSV(text) {
    const lines = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                currentField += '"';
                i++; // Skip escape quote
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            currentRow.push(currentField);
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !insideQuotes) {
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
            currentRow.push(currentField);
            lines.push(currentRow);
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        lines.push(currentRow);
    }
    return lines;
}

function processIgData(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const rows = parseCSV(fileContent);

        if (rows.length === 0) return [];

        // Extract headers from first row
        const headers = rows[0].map(h => h.trim());
        const dateIndex = headers.indexOf('Date');
        const mentionsIndex = headers.indexOf('Mentions');

        if (dateIndex === -1 || mentionsIndex === -1) {
            return JSON.stringify({ error: "Required columns 'Date' or 'Mentions' not found" });
        }

        const mentionStats = {};

        // Iterate starting from second row
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length <= Math.max(dateIndex, mentionsIndex)) continue; // Skip incomplete rows

            const dateStr = row[dateIndex];
            const mentionsStr = row[mentionsIndex];

            if (!dateStr || !mentionsStr) continue;

            const mentions = mentionsStr.split(',').map(m => m.trim()).filter(m => m);
            if (mentions.length === 0) continue;

            for (let mention of mentions) {
                // Normalize username
                let username = mention.startsWith('@') ? mention : '@' + mention;

                if (!mentionStats[username]) {
                    mentionStats[username] = { count: 0, first_seen: dateStr };
                } else {
                    mentionStats[username].count += 1;
                    // String comparison for YYYY-MM-DD works correctly
                    if (dateStr < mentionStats[username].first_seen) {
                        mentionStats[username].first_seen = dateStr;
                    }
                }
            }
        }

        // Format output
        const outputList = Object.keys(mentionStats).map(username => ({
            "Name": username,
            "@IGusername": username,
            "Date_First_Posted": mentionStats[username].first_seen,
            "Number_of_Mentions": mentionStats[username].count + 1 // Initial logic in py was +1 per loop, effectively counting each occurrence
        }));
        
        // Wait, logic check: in python:
        // stats['count'] += 1
        // In loop:
        // for mention in mentions:
        //    stats['count'] += 1
        // So yes, just straight count.
        
        // Correcting JS logic to match Python:
        // Python: stats['count'] += 1 (starts at 0)
        // JS above: mentionStats[username].count += 1 (starts at ??)
        
        // Let's re-verify the logic in the loop below.
        return outputList.sort((a, b) => b.Number_of_Mentions - a.Number_of_Mentions);

    } catch (err) {
        return JSON.stringify({ error: err.message });
    }
}

// Fixed logic for main processing function to be clearer
function processAndPrint() {
    try {
        const fileContent = fs.readFileSync(csvFilePath, 'utf8');
        const rows = parseCSV(fileContent);
        
        const headers = rows[0].map(h => h.trim());
        const dateIndex = headers.indexOf('Date');
        const mentionsIndex = headers.indexOf('Mentions');
        
        const stats = {};
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
             // Safety check for row length
            const dateStr = row[dateIndex];
            const mentionsStr = row[mentionsIndex];
            
            if (!dateStr || !mentionsStr) continue;
            
            // Basic date validation (YYYY-MM-DD)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

            const mentions = mentionsStr.split(',').map(m => m.trim().replace(/^['"]|['"]$/g, '')); // remove potential wrapper quotes from split if simple split

            for (const m of mentions) {
                if (!m) continue;
                const username = m.startsWith('@') ? m : `@${m}`;
                
                if (!stats[username]) {
                    stats[username] = { count: 0, first_seen: dateStr };
                }
                
                stats[username].count++;
                if (dateStr < stats[username].first_seen) {
                    stats[username].first_seen = dateStr;
                }
            }
        }
        
        const output = Object.keys(stats).map(u => ({
            "Name": u,
            "@IGusername": u,
            "Date_First_Posted": stats[u].first_seen,
            "Number_of_Mentions": stats[u].count
        })).sort((a, b) => b.Number_of_Mentions - a.Number_of_Mentions);
        
        console.log(JSON.stringify(output, null, 2));
        
    } catch (error) {
        console.error("Error:", error.message);
    }
}

processAndPrint();
