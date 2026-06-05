/**
 * Note Templates
 * Each template has an id, label, emoji, description, and content string.
 * The content uses placeholder markers that the user replaces.
 */

export const TEMPLATES = [
  {
    id: 'book',
    label: 'Book Summary',
    emoji: '📚',
    description: 'Capture key ideas from a book',
    defaultTitle: 'Book Summary: ',
    content: `Book: 
Author: 
Rating: /10
Finished: 

## Key Ideas
- 
- 
- 

## My Takeaways
- 
- 

## Memorable Quotes
> 

## Would I Recommend?
`,
  },
  {
    id: 'meeting',
    label: 'Meeting Notes',
    emoji: '🗓️',
    description: 'Document meetings and action items',
    defaultTitle: 'Meeting: ',
    content: `Date: 
Attendees: 
Agenda: 

## Discussion
- 

## Decisions Made
- 

## Action Items
- [ ] 
- [ ] 

## Next Meeting
`,
  },
  {
    id: 'research',
    label: 'Research Note',
    emoji: '🔬',
    description: 'Structured research and findings',
    defaultTitle: 'Research: ',
    content: `Topic: 
Source: 
Date: 

## Overview


## Key Findings
- 
- 
- 

## Evidence / Data


## Questions to Explore
- 

## Conclusions
`,
  },
  {
    id: 'journal',
    label: 'Daily Journal',
    emoji: '✏️',
    description: 'Reflect on your day',
    defaultTitle: `Journal — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
    content: `## What happened today


## What I learned


## What I'm grateful for
- 
- 

## Tomorrow's focus
- 
`,
  },
  {
    id: 'learning',
    label: 'Learning Note',
    emoji: '🧠',
    description: 'Document something new you learned',
    defaultTitle: 'Learning: ',
    content: `Topic: 
Source: 

## What I Learned


## Why It Matters


## How I'll Apply This
- 

## Related Concepts
- 

## Questions
- 
`,
  },
  {
    id: 'project',
    label: 'Project Plan',
    emoji: '🎯',
    description: 'Plan a project or goal',
    defaultTitle: 'Project: ',
    content: `## Goal


## Why This Matters


## Steps
1. 
2. 
3. 

## Resources Needed
- 

## Deadline: 

## Success Looks Like
`,
  },
];
