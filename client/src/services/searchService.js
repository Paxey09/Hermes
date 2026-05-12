import { supabase } from '../config/supabaseClient';
import { aiModules } from './ai';

class ExecutiveSearchService {
  constructor() {
    this.searchCache = new Map();
    this.recentSearches = JSON.parse(localStorage.getItem('executiveSearch_recent') || '[]');
    this.savedSearches = JSON.parse(localStorage.getItem('executiveSearch_saved') || '[]');
  }

  // Universal search across all modules
  async search(query, options = {}) {
    const {
      modules = ['all'], // 'all' or specific modules
      limit = 20,
      filters = {},
      useAI = true
    } = options;

    const cacheKey = `${query}_${JSON.stringify(options)}`;
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey);
    }

    try {
      let results = [];

      // Search across all modules
      if (modules.includes('all') || modules.includes('deals')) {
        const deals = await this.searchDeals(query, filters);
        results = results.concat(deals.map(item => ({ ...item, module: 'deals', icon: 'TrendingUp' })));
      }

      if (modules.includes('all') || modules.includes('contacts')) {
        const contacts = await this.searchContacts(query, filters);
        results = results.concat(contacts.map(item => ({ ...item, module: 'contacts', icon: 'Users' })));
      }

      if (modules.includes('all') || modules.includes('projects')) {
        const projects = await this.searchProjects(query, filters);
        results = results.concat(projects.map(item => ({ ...item, module: 'projects', icon: 'Briefcase' })));
      }

      if (modules.includes('all') || modules.includes('tasks')) {
        const tasks = await this.searchTasks(query, filters);
        results = results.concat(tasks.map(item => ({ ...item, module: 'tasks', icon: 'CheckSquare' })));
      }

      if (modules.includes('all') || modules.includes('revenue')) {
        const revenue = await this.searchRevenue(query, filters);
        results = results.concat(revenue.map(item => ({ ...item, module: 'revenue', icon: 'DollarSign' })));
      }

      if (modules.includes('all') || modules.includes('team')) {
        const team = await this.searchTeam(query, filters);
        results = results.concat(team.map(item => ({ ...item, module: 'team', icon: 'Users2' })));
      }

      if (modules.includes('all') || modules.includes('knowledge')) {
        const knowledge = await this.searchKnowledgeBase(query, filters);
        results = results.concat(knowledge.map(item => ({ ...item, module: 'knowledge', icon: 'Book' })));
      }

      if (modules.includes('all') || modules.includes('inbox')) {
        const inbox = await this.searchInbox(query, filters);
        results = results.concat(inbox.map(item => ({ ...item, module: 'inbox', icon: 'Inbox' })));
      }

      // AI-powered ranking and enhancement
      if (useAI && query.length > 2) {
        results = await this.enhanceResultsWithAI(query, results);
      }

      // Sort by relevance score
      results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      // Limit results
      const finalResults = results.slice(0, limit);

      // Cache results
      this.searchCache.set(cacheKey, finalResults);
      setTimeout(() => this.searchCache.delete(cacheKey), 300000); // 5 minutes cache

      // Add to recent searches
      this.addToRecentSearches(query);

      return finalResults;

    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  // Individual module search methods
  async searchDeals(query, filters = {}) {
    try {
      let dbQuery = supabase
        .from('deals')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,company.ilike.%${query}%`);

      if (filters.status) {
        dbQuery = dbQuery.eq('status', filters.status);
      }
      if (filters.priority) {
        dbQuery = dbQuery.eq('priority', filters.priority);
      }

      const { data, error } = await dbQuery.limit(10);
      
      if (error) throw error;
      
      return data.map(deal => ({
        id: deal.id,
        title: deal.title,
        subtitle: deal.company,
        description: deal.description,
        status: deal.status,
        priority: deal.priority,
        value: deal.value,
        url: `/Admin/Deals`,
        relevanceScore: this.calculateRelevance(query, [deal.title, deal.company, deal.description])
      }));
    } catch (error) {
      console.error('Deals search error:', error);
      return [];
    }
  }

  async searchContacts(query, filters = {}) {
    try {
      let dbQuery = supabase
        .from('contacts')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%,notes.ilike.%${query}%`);

      if (filters.type) {
        dbQuery = dbQuery.eq('type', filters.type);
      }

      const { data, error } = await dbQuery.limit(10);
      
      if (error) throw error;
      
      return data.map(contact => ({
        id: contact.id,
        title: contact.name,
        subtitle: contact.email,
        description: contact.company,
        status: contact.status,
        url: `/Admin/Contacts`,
        relevanceScore: this.calculateRelevance(query, [contact.name, contact.email, contact.company])
      }));
    } catch (error) {
      console.error('Contacts search error:', error);
      return [];
    }
  }

  async searchProjects(query, filters = {}) {
    try {
      let dbQuery = supabase
        .from('projects')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,client.ilike.%${query}%`);

      if (filters.status) {
        dbQuery = dbQuery.eq('status', filters.status);
      }

      const { data, error } = await dbQuery.limit(10);
      
      if (error) throw error;
      
      return data.map(project => ({
        id: project.id,
        title: project.name,
        subtitle: project.client,
        description: project.description,
        status: project.status,
        progress: project.progress,
        url: `/Admin/Projects`,
        relevanceScore: this.calculateRelevance(query, [project.name, project.client, project.description])
      }));
    } catch (error) {
      console.error('Projects search error:', error);
      return [];
    }
  }

  async searchTasks(query, filters = {}) {
    try {
      let dbQuery = supabase
        .from('tasks')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,assignee.ilike.%${query}%`);

      if (filters.status) {
        dbQuery = dbQuery.eq('status', filters.status);
      }
      if (filters.priority) {
        dbQuery = dbQuery.eq('priority', filters.priority);
      }

      const { data, error } = await dbQuery.limit(10);
      
      if (error) throw error;
      
      return data.map(task => ({
        id: task.id,
        title: task.title,
        subtitle: task.assignee,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        url: `/Admin/Tasks`,
        relevanceScore: this.calculateRelevance(query, [task.title, task.description, task.assignee])
      }));
    } catch (error) {
      console.error('Tasks search error:', error);
      return [];
    }
  }

  async searchRevenue(query, filters = {}) {
    try {
      let dbQuery = supabase
        .from('revenue')
        .select('*')
        .or(`source.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);

      if (filters.category) {
        dbQuery = dbQuery.eq('category', filters.category);
      }

      const { data, error } = await dbQuery.limit(10);
      
      if (error) throw error;
      
      return data.map(revenue => ({
        id: revenue.id,
        title: revenue.source,
        subtitle: revenue.category,
        description: revenue.description,
        amount: revenue.amount,
        date: revenue.date,
        url: `/Admin/Revenue`,
        relevanceScore: this.calculateRelevance(query, [revenue.source, revenue.description, revenue.category])
      }));
    } catch (error) {
      console.error('Revenue search error:', error);
      return [];
    }
  }

  async searchTeam(query, filters = {}) {
    try {
      let dbQuery = supabase
        .from('team_members')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,role.ilike.%${query}%,department.ilike.%${query}%`);

      if (filters.department) {
        dbQuery = dbQuery.eq('department', filters.department);
      }

      const { data, error } = await dbQuery.limit(10);
      
      if (error) throw error;
      
      return data.map(member => ({
        id: member.id,
        title: member.name,
        subtitle: member.role,
        description: member.department,
        status: member.status,
        url: `/Admin/Team`,
        relevanceScore: this.calculateRelevance(query, [member.name, member.role, member.department])
      }));
    } catch (error) {
      console.error('Team search error:', error);
      return [];
    }
  }

  async searchKnowledgeBase(query, filters = {}) {
    try {
      let dbQuery = supabase
        .from('knowledge_articles')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,category.ilike.%${query}%`);

      if (filters.category) {
        dbQuery = dbQuery.eq('category_id', filters.category);
      }

      const { data, error } = await dbQuery.limit(10);
      
      if (error) throw error;
      
      return data.map(article => ({
        id: article.id,
        title: article.title,
        subtitle: article.category,
        description: article.excerpt || article.content?.substring(0, 100),
        status: article.status,
        url: `/Admin/KnowledgeBase`,
        relevanceScore: this.calculateRelevance(query, [article.title, article.content])
      }));
    } catch (error) {
      console.error('Knowledge search error:', error);
      return [];
    }
  }

  async searchInbox(query, filters = {}) {
    try {
      let dbQuery = supabase
        .from('conversations')
        .select('*')
        .or(`subject.ilike.%${query}%,message.ilike.%${query}%,sender.ilike.%${query}%`);

      if (filters.status) {
        dbQuery = dbQuery.eq('status', filters.status);
      }

      const { data, error } = await dbQuery.limit(10);
      
      if (error) throw error;
      
      return data.map(conversation => ({
        id: conversation.id,
        title: conversation.subject,
        subtitle: conversation.sender,
        description: conversation.message,
        status: conversation.status,
        unread: conversation.unread,
        url: `/Admin/Inbox`,
        relevanceScore: this.calculateRelevance(query, [conversation.subject, conversation.message])
      }));
    } catch (error) {
      console.error('Inbox search error:', error);
      return [];
    }
  }

  // AI-powered result enhancement
  async enhanceResultsWithAI(query, results) {
    try {
      const enhancement = await aiModules.enhanceSearchResults(query, results);
      
      return results.map((result, index) => ({
        ...result,
        relevanceScore: enhancement.scores?.[index] || result.relevanceScore,
        aiContext: enhancement.context?.[index] || null
      }));
    } catch (error) {
      console.error('AI enhancement error:', error);
      return results;
    }
  }

  // Calculate basic relevance score
  calculateRelevance(query, fields) {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    fields.forEach(field => {
      if (field) {
        const fieldLower = field.toLowerCase();
        if (fieldLower === queryLower) score += 100; // Exact match
        else if (fieldLower.includes(queryLower)) score += 50; // Partial match
        else if (queryLower.includes(fieldLower)) score += 25; // Query contains field
      }
    });
    
    return score;
  }

  // Search suggestions/autocomplete
  async getSuggestions(query) {
    if (query.length < 2) return [];
    
    try {
      // Get recent searches that match
      const recentMatches = this.recentSearches
        .filter(search => search.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3);

      // Get popular entities from database
      const suggestions = await this.getPopularEntities(query);
      
      return [...recentMatches, ...suggestions].slice(0, 8);
    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  }

  async getPopularEntities(query) {
    // This would fetch popular contacts, projects, etc. based on query
    // For now, return empty array - can be enhanced later
    return [];
  }

  // Recent searches management
  addToRecentSearches(query) {
    if (!query || query.length < 2) return;
    
    this.recentSearches = this.recentSearches.filter(search => search !== query);
    this.recentSearches.unshift(query);
    this.recentSearches = this.recentSearches.slice(0, 10); // Keep only 10 recent
    
    localStorage.setItem('executiveSearch_recent', JSON.stringify(this.recentSearches));
  }

  getRecentSearches() {
    return this.recentSearches;
  }

  clearRecentSearches() {
    this.recentSearches = [];
    localStorage.removeItem('executiveSearch_recent');
  }

  // Saved searches management
  saveSearch(name, query, options = {}) {
    const savedSearch = {
      id: Date.now().toString(),
      name,
      query,
      options,
      createdAt: new Date().toISOString()
    };
    
    this.savedSearches.push(savedSearch);
    localStorage.setItem('executiveSearch_saved', JSON.stringify(this.savedSearches));
    
    return savedSearch;
  }

  getSavedSearches() {
    return this.savedSearches;
  }

  deleteSavedSearch(id) {
    this.savedSearches = this.savedSearches.filter(search => search.id !== id);
    localStorage.setItem('executiveSearch_saved', JSON.stringify(this.savedSearches));
  }

  // Natural language query processing
  async processNaturalLanguageQuery(query) {
    try {
      return await aiModules.processSearchQuery(query);
    } catch (error) {
      console.error('Natural language processing error:', error);
      return { query, filters: {}, modules: ['all'] };
    }
  }
}

export const executiveSearch = new ExecutiveSearchService();
export default executiveSearch;
