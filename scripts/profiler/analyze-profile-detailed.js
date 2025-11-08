#!/usr/bin/env node

import fs from 'fs';

const profilePath = process.argv[2] || '.profile/profiling-data.11-07-2025.19-21-51.json';
const data = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

console.log('=== Detailed Component Analysis ===\n');

data.dataForRoots.forEach((rootData, rootIndex) => {
  console.log(`\n--- Root ${rootIndex + 1} ---`);

  // Build fiber ID to component name mapping from snapshots
  const fiberMap = new Map();
  if (rootData.snapshots && rootData.snapshots.length > 0) {
    rootData.snapshots.forEach((snapshot, snapIndex) => {
      snapshot.forEach(fiber => {
        if (!fiberMap.has(fiber.id)) {
          fiberMap.set(fiber.id, {
            id: fiber.id,
            displayName: fiber.displayName || 'Unknown',
            type: fiber.type,
            key: fiber.key
          });
        }
      });
    });
  }

  console.log(`\nComponent tree (from snapshots):`);
  console.log(`Total unique fibers tracked: ${fiberMap.size}`);

  // Count re-renders per component
  const componentChangeCounts = {};
  rootData.commitData.forEach(commit => {
    if (commit.changeDescriptions) {
      commit.changeDescriptions.forEach(([fiberId, changeDesc]) => {
        componentChangeCounts[fiberId] = (componentChangeCounts[fiberId] || 0) + 1;
      });
    }
  });

  // Get component details with re-render counts
  const componentDetails = Object.entries(componentChangeCounts)
    .map(([fiberId, count]) => {
      const fiber = fiberMap.get(parseInt(fiberId));
      return {
        fiberId: parseInt(fiberId),
        count,
        displayName: fiber?.displayName || `Unknown Fiber #${fiberId}`,
        type: fiber?.type || 'unknown'
      };
    })
    .sort((a, b) => b.count - a.count);

  console.log(`\nComponents with excessive re-renders (>10):`);
  console.log(`─`.repeat(80));
  console.log(`${'Component'.padEnd(40)} ${'Type'.padEnd(15)} ${'Re-renders'.padEnd(10)}`);
  console.log(`─`.repeat(80));

  componentDetails
    .filter(c => c.count > 10)
    .forEach(({ displayName, type, count }) => {
      console.log(`${displayName.padEnd(40)} ${String(type).padEnd(15)} ${String(count).padEnd(10)}`);
    });

  // Group by component name to see patterns
  const nameGroups = {};
  componentDetails.forEach(({ displayName, count }) => {
    if (!nameGroups[displayName]) {
      nameGroups[displayName] = { count: 0, instances: 0 };
    }
    nameGroups[displayName].count += count;
    nameGroups[displayName].instances += 1;
  });

  console.log(`\n\nAggregate by component name:`);
  console.log(`─`.repeat(80));
  console.log(`${'Component'.padEnd(40)} ${'Instances'.padEnd(12)} ${'Total Re-renders'.padEnd(15)}`);
  console.log(`─`.repeat(80));

  Object.entries(nameGroups)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .forEach(([name, { count, instances }]) => {
      console.log(`${name.padEnd(40)} ${String(instances).padEnd(12)} ${String(count).padEnd(15)}`);
    });

  // Analyze commit patterns
  console.log(`\n\nCommit Analysis:`);
  console.log(`─`.repeat(80));
  console.log(`Total commits: ${rootData.commitData.length}`);

  const commitsByPriority = {};
  rootData.commitData.forEach(commit => {
    const priority = commit.priorityLevel || 'unknown';
    commitsByPriority[priority] = (commitsByPriority[priority] || 0) + 1;
  });

  console.log(`\nCommits by priority level:`);
  Object.entries(commitsByPriority)
    .sort((a, b) => b[1] - a[1])
    .forEach(([priority, count]) => {
      console.log(`  ${priority}: ${count}`);
    });

  // Check for commits with many component updates
  const largeCommits = rootData.commitData
    .map((commit, index) => ({
      index,
      duration: commit.duration,
      changeCount: commit.changeDescriptions?.length || 0,
      priority: commit.priorityLevel
    }))
    .filter(c => c.changeCount > 10)
    .sort((a, b) => b.changeCount - a.changeCount);

  if (largeCommits.length > 0) {
    console.log(`\n\nLarge commits (>10 component updates):`);
    console.log(`─`.repeat(80));
    console.log(`Count: ${largeCommits.length} / ${rootData.commitData.length} commits`);
    console.log(`\nTop 10 largest:`);
    largeCommits.slice(0, 10).forEach(({ index, duration, changeCount, priority }) => {
      console.log(`  Commit #${index}: ${changeCount} components, ${duration.toFixed(2)}ms, priority: ${priority}`);
    });
  }
});

console.log('\n\n=== Analysis Complete ===\n');
