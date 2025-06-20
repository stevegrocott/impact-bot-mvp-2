# Automated Planning Document System

## Overview
This system automatically keeps planning documents synchronized with development progress through git hooks and automated analysis.

## How It Works

### 🤖 Automated Updates
Planning documents are automatically updated on every git commit through:

1. **Post-Commit Hook** (`.githooks/post-commit`)
   - Triggers after successful commits
   - Analyzes project status and completion
   - Updates planning documents
   - Creates follow-up commit with doc changes

2. **Planning Doc Updater** (`scripts/update-planning-docs.js`)
   - Analyzes file system for implemented features
   - Parses git history for completion patterns
   - Generates updated content based on current state
   - Maintains epic tracking and progress metrics

### 📄 Updated Documents

#### TASK-TRACKER.md
- **Epic completion status** - Real-time tracking of all epics
- **Implementation progress** - Percentage completion based on key files
- **Recent git activity** - Summary of latest commits
- **Platform capabilities** - Current feature status
- **Next steps** - Contextual recommendations

#### PROJECT-ROADMAP.md  
- **Epic status overview** - Complete progress tracking
- **Implementation metrics** - Automated feature analysis
- **Development activity** - Git-based progress assessment
- **Future roadmap** - Next phase planning
- **Quality metrics** - Automated validation results

### 🔄 Update Triggers

The system updates documentation when:
- ✅ **Git commits** are made (primary trigger)
- 📊 **Feature completion** is detected
- 🎯 **Epic milestones** are reached
- 📝 **Todo lists** are modified (via Claude Code)

### 📊 Tracking Sources

The automation analyzes:
- **File System**: Checks for implemented components
- **Git History**: Tracks development progress and patterns
- **Commit Messages**: Detects completion indicators (✅, 🎉, etc.)
- **Key Files**: Monitors critical feature implementations

## Manual Usage

### Run Updates Manually
```bash
# From frontend directory
npm run update-docs

# From project root
node scripts/update-planning-docs.js
```

### Force Documentation Sync
```bash
# Update docs and commit changes
npm run update-docs
git add docs/planning/
git commit -m "docs: manual planning document update"
```

## Configuration

### Key Files Tracked
The system monitors these files for completion assessment:
- `frontend/src/components/AIPersonalityWidget.tsx`
- `frontend/src/components/AdvancedFoundationWorkflow.tsx`
- `frontend/src/modules/onboarding/components/FoundationReadinessCard.tsx`
- `frontend/src/components/PeerBenchmarkingDashboard.tsx`
- `frontend/src/components/KnowledgeSharingHub.tsx`

### Epic Mapping
Epics are tracked with completion status:
- **Epic 1**: Foundation Infrastructure (5 tasks)
- **Epic 2**: Multi-Tenant Platform Core (4 tasks)  
- **Epic 3**: Impact Measurement Core (5 tasks)
- **Epic 4**: Data Collection & Reporting (6 tasks)
- **Epic 5**: Advanced AI-Powered Features (6 tasks)
- **Epic 6**: Testing & Safety Framework (5 tasks)
- **Epic 7**: GUI & User Experience (6 tasks)

## Maintenance

### Updating Epic Data
To modify epic tracking, edit the `EPICS` object in `scripts/update-planning-docs.js`:

```javascript
const EPICS = {
  'epic-id': {
    name: 'Epic Name',
    tasks: 5,
    priority: 'High',
    completion: 'Month Year'
  }
};
```

### Adding New Tracked Files
Add files to the `keyFiles` array in the `getProjectStatus()` function:

```javascript
const keyFiles = [
  'frontend/src/new-feature.tsx',
  // ... existing files
];
```

### Customizing Templates
Modify the content generation functions:
- `generateTaskTracker()` - Updates TASK-TRACKER.md format
- `generateProjectRoadmap()` - Updates PROJECT-ROADMAP.md format

## Troubleshooting

### Hook Not Running
```bash
# Ensure hooks are executable
chmod +x .githooks/post-commit

# Check git hook configuration
git config core.hooksPath .githooks
```

### Manual Hook Execution
```bash
# Run post-commit hook manually
./.githooks/post-commit
```

### Script Debugging
```bash
# Run with verbose output
node scripts/update-planning-docs.js --verbose

# Check git status
git status docs/planning/
```

## Benefits

### 🎯 Always Current
- Planning documents reflect actual implementation status
- No manual synchronization required
- Real-time progress tracking

### 📊 Accurate Metrics
- Completion percentages based on actual files
- Git history provides objective progress data
- Epic tracking aligned with implementation

### 🚀 Zero Maintenance
- Automatic updates on every commit
- Self-correcting documentation
- No developer overhead for doc updates

### 🔍 Development Insights
- Track development velocity through commit analysis
- Identify completion patterns and milestones
- Maintain historical progress records

## Future Enhancements

Potential improvements to the automation system:
- **Todo Integration**: Direct parsing of Claude Code todo lists
- **Metric Visualization**: Generate progress charts and graphs
- **Slack Integration**: Notify team of milestone completions
- **Quality Metrics**: Integrate test coverage and code quality data
- **Deployment Sync**: Link documentation to deployment status

---

**🤖 This system ensures planning documents stay automatically synchronized with development reality, providing accurate, real-time project status without manual intervention.**