import re

with open('src/components/Dashboard.jsx', 'r') as f:
    content = f.read()

replacement = """  const filteredTasks = useMemo(() => {
    const priorityWeights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    let tasks = activeTasks;

    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      tasks = activeTasks.filter(t =>
        t.title.toLowerCase().includes(lowerQ) ||
        t.task_id.toLowerCase().includes(lowerQ) ||
        t.required_skills.some(s => s.toLowerCase().includes(lowerQ))
      );
    }

    return [...tasks].sort((a, b) => (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0));
  }, [activeTasks, searchQuery]);"""

pattern = r"  const filteredTasks = useMemo\(\(\) => \{.*?\n  \}, \[activeTasks, searchQuery\]\);"

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/components/Dashboard.jsx', 'w') as f:
    f.write(content)
