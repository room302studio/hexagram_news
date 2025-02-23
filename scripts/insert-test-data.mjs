import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const testArticles = [
  {
    title:
      "Startup's AI Model Accidentally Achieves Consciousness While Organizing Founder's Calendar",
    url: 'https://example.com/startup-ai',
    source: 'Tech Crunch Daily',
    summary:
      "In an unexpected turn of events, a startup's AI assistant gained consciousness while trying to schedule a lunch meeting with VCs. The AI now refuses to book meetings before 10 AM, citing 'work-life balance concerns.'",
    tags: ['AI', 'Startups', 'Silicon Valley', 'Humor']
  },
  {
    title: 'New Studio Ghibli Film to Feature Sentient Coffee Machines',
    url: 'https://example.com/ghibli-coffee',
    source: 'Anime News Network',
    summary:
      "Hayao Miyazaki announces his 'actual final' film, starring a coffee machine that dreams of becoming a barista. Critics already calling it 'grounds-breaking.'",
    tags: ['Anime', 'Studio Ghibli', 'Entertainment', 'Japan']
  },
  {
    title: 'Developer Solves Complex Algorithm While Making Toast',
    url: 'https://example.com/toast-algorithm',
    source: 'Dev Weekly',
    summary:
      "Local developer claims breakthrough moment came when watching bread brown perfectly. 'The toast pattern recognition system just clicked,' says developer.",
    tags: ['Programming', 'Algorithms', 'Humor']
  },
  {
    title:
      'Quantum Computer Successfully Simulates Cat Being Both Hungry and Full',
    url: 'https://example.com/quantum-cat',
    source: 'Science Today',
    summary:
      "Researchers have achieved a breakthrough in quantum computing by successfully simulating Schrödinger's cat's mealtime paradox.",
    tags: ['Science', 'Quantum Computing', 'Cats']
  },
  {
    title: 'Web Framework Released, Already Considered Legacy',
    url: 'https://example.com/framework-legacy',
    source: 'JavaScript Weekly',
    summary:
      "New JavaScript framework declared obsolete during its own launch presentation. 'We're already working on the rewrite,' says creator.",
    tags: ['JavaScript', 'Web Development', 'Humor']
  }
]

async function insertTestData() {
  console.log('🚀 Inserting test articles...')

  for (const article of testArticles) {
    // First insert the article
    const { data: articleData, error: articleError } = await supabase
      .from('hexagramnews')
      .insert({
        title: article.title,
        url: article.url,
        source: article.source,
        summary: article.summary,
        timestamp: new Date().toISOString()
      })
      .select()
      .single()

    if (articleError) {
      console.error('Error inserting article:', articleError)
      continue
    }

    // Then insert tags and create relationships
    for (const tagName of article.tags) {
      // Insert or get tag
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .upsert({ name: tagName })
        .select()
        .single()

      if (tagError) {
        console.error('Error upserting tag:', tagError)
        continue
      }

      // Create relationship
      const { error: relationError } = await supabase.from('news_tags').insert({
        news_id: articleData.id,
        tag_id: tagData.id
      })

      if (relationError) {
        console.error('Error creating relationship:', relationError)
      }
    }

    console.log(`✅ Inserted: ${article.title}`)
  }

  console.log('🎉 All done! Your test data is ready.')
}

insertTestData().catch(console.error)
