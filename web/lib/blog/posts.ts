export interface BlogPost {
  slug: string
  title: string
  description: string
  category: string
  date: string
  readTime: string
  author: string
  authorRole: string
  sections: BlogSection[]
}

export interface BlogSection {
  id: string
  heading?: string
  content: string // HTML string — rendered via dangerouslySetInnerHTML
}

export const POSTS: BlogPost[] = [
  {
    slug: 'why-tax-professionals-stay-stuck-in-referral-only-growth',
    title: 'Why so many tax professionals stay stuck in referral-only growth',
    description:
      'Why independent tax professionals struggle with referrals, seasonal revenue, weak onboarding, and unstructured offers, and how Virtual Launch Pro with Tax Monitor helps turn expertise into recurring revenue.',
    category: 'Market',
    date: '2026-03-08',
    readTime: '8 min read',
    author: 'JLW',
    authorRole: 'EA turned agency builder',
    sections: [
      {
        id: 'introduction',
        content: `<p>Many independent EAs, CPAs, tax attorneys, and modern virtual firms have strong technical skill but weak growth infrastructure. The problem is rarely expertise. It is usually distribution, packaging, onboarding, and recurring revenue design.</p>`,
      },
      {
        id: 'pain-point-1',
        heading: 'Pain point one: client acquisition still depends on referrals',
        content: `<p>Referrals are useful. They carry trust before a conversation begins. But they are not a growth system. They are an outcome of existing relationships, not a path to building new ones at scale. Most tax professionals understand this in theory and resist it in practice because it is uncomfortable to admit the referral channel has a ceiling.</p><p>When the only real marketing method is asking satisfied clients to tell other people, the practice becomes heavily dependent on who is in the room at the right moment. That creates unpredictable pipeline, weak positioning, and no natural way to explain what the firm does to someone who has never heard of it.</p><p>Virtual Launch Pro and Tax Monitor address this by putting the professional inside a discovery network where taxpayers are already looking for help. Instead of waiting for an introduction, the firm becomes visible in the places where intent already exists.</p>`,
      },
      {
        id: 'pain-point-2',
        heading: 'Pain point two: services are difficult to explain and harder to sell',
        content: `<p>Tax professionals often describe their work in terms that make complete sense to other professionals and very little sense to a taxpayer who is just trying to figure out if they need help. The result is a soft offer that sounds expensive and unclear at the same time.</p><p>Structured packaging solves this. When a service has a defined name, a defined starting point, a clear outcome, and a predictable price, it becomes easier to sell and easier for the client to say yes to. It also creates more credibility in directories and profile pages, where first impressions are doing most of the work.</p>`,
      },
      {
        id: 'pain-point-3',
        heading: 'Pain point three: onboarding still depends on manual coordination',
        content: `<p>Tax professionals often lose momentum at the exact moment a client says yes. Intake forms, follow-up messages, payment links, file requests, scheduling steps, and status updates end up scattered across disconnected tools. Staff members become the glue holding together a journey that should already have shape.</p><p>Virtual Launch Pro solves this with structured onboarding systems designed for calm delivery. Intake, payment, uploads, progress, and next steps can be organized into one cleaner path. The result is not just efficiency. It is a more credible client experience.</p>`,
      },
      {
        id: 'pain-point-4',
        heading: 'Pain point four: seasonal tax preparation keeps dominating the revenue model',
        content: `<p>Many skilled practitioners are trapped in a seasonal rhythm. Filing season swells the workload, and then the rest of the year becomes a scramble to stabilize cash flow. That pattern is limiting. It makes it harder to invest in better systems, stronger positioning, and proactive client relationships.</p><p>That is where Tax Monitor becomes strategically important. VLP is not just about cleaner onboarding. It is about helping firms move from one-off work into structured recurring monitoring relationships.</p>`,
      },
      {
        id: 'pain-point-5',
        heading: 'Pain point five: tax resolution becomes the default offer instead of proactive monitoring',
        content: `<p>Too many practices meet clients only after the problem is already painful. That tends to push firms into a reactive posture where tax resolution becomes the main visible offer, even when the smarter long-term opportunity would be earlier diagnosis, monitoring, and proactive service.</p><p>VLP, together with transcript and monitoring capabilities across the ecosystem, creates a better path. A taxpayer may discover a problem through Tax Tools, use Transcripts for analysis or diagnostics, and then connect with a professional who can offer monitoring, compliance help, or representation.</p>`,
      },
      {
        id: 'firm-types',
        heading: 'This matters across several kinds of firms',
        content: `<p>The market is not just one type of practitioner. Independent EAs may want cleaner offer packaging and more reliable discovery. Tax resolution specialists may want earlier monitoring clients before problems escalate. Modern virtual firms may care most about structured onboarding, automation, and scalable delivery.</p><p>Different firms enter from different angles, but the structural issues are remarkably similar. Weak positioning. Weak packaging. Weak distribution. Manual onboarding. Too much dependency on referrals or seasonal work.</p>`,
      },
      {
        id: 'ecosystem-effect',
        heading: 'The ecosystem effect is the bigger advantage',
        content: `<p>Virtual Launch Pro becomes more valuable because it does not operate alone. Tax Tools can attract taxpayers searching for answers. Transcripts can turn uncertainty into diagnostics and reports. Tax Monitor can support recurring monitoring and professional discovery. VLP gives the professional the infrastructure to turn that attention and utility into a working service model.</p>`,
      },
      {
        id: 'the-real-shift',
        heading: 'The real shift',
        content: `<p>The strongest tax professionals should not have to choose between technical excellence and modern growth infrastructure. They should be able to do both.</p><p>When client discovery improves, services are packaged clearly, onboarding becomes structured, and monitoring creates a recurring layer beyond filing season, the practice starts to behave differently. It becomes calmer, more credible, and more scalable.</p>`,
      },
      {
        id: 'sources',
        heading: 'Sources',
        content: `<p class="text-sm text-white/60"><sup>1</sup> <a href="https://www.thomsonreuters.com/en-us/posts/tax-and-accounting/tax-professionals-report-2024/" target="_blank" rel="noopener noreferrer" class="underline hover:text-orange-400">Thomson Reuters Institute, 2024 State of Tax Professionals Report</a> — Documents structural challenges facing independent tax and accounting firms.<br><br><a href="https://www.aicpa-cima.com/professional-insights/article/pcps-cpa-firm-top-issues-survey" target="_blank" rel="noopener noreferrer" class="underline hover:text-orange-400">AICPA &amp; CIMA, CPA Firm Top Issues Survey</a> — Repeated surveys showing growth, technology, and infrastructure challenges for small practices.<br><br><a href="https://www.naea.org/how-enrolled-agents-can-thrive-in-an-uncertain-2026-economy-insights-from-the-cpa-trendlines-forecast/" target="_blank" rel="noopener noreferrer" class="underline hover:text-orange-400">NAEA, How Enrolled Agents Can Thrive</a> — Market pressures and the need for stronger positioning for independent tax professionals.</p><p class="text-sm text-white/60 mt-4"><sup>2</sup> <a href="https://quickbooks.intuit.com/r/small-business-data/accountant-tech-survey-2024/" target="_blank" rel="noopener noreferrer" class="underline hover:text-orange-400">Intuit QuickBooks, 2024 Accountant Technology Survey</a> — Technology adoption and operational modernization gaps.<br><br><a href="https://www.journalofaccountancy.com/issues/2021/dec/cas-practices-see-20-percent-growth/" target="_blank" rel="noopener noreferrer" class="underline hover:text-orange-400">Journal of Accountancy, CAS Practices See 20% Growth</a> — Increasing demand for recurring advisory and monitoring services.</p>`,
      },
    ],
  },
  {
    slug: 'why-tax-professionals-need-more-than-referrals-to-grow',
    title: 'Why tax professionals need more than referrals to grow',
    description:
      'Referrals still matter, but they do not create predictable discovery, structured onboarding, or recurring revenue on their own. Here is why modern tax firms need stronger growth infrastructure.',
    category: 'Distribution',
    date: '2026-03-09',
    readTime: '8 min read',
    author: 'JLW',
    authorRole: 'EA turned agency builder',
    sections: [
      {
        id: 'intro',
        content: `<p>Referrals are useful because trust arrives before the sales conversation begins. The problem is that a referral channel is not the same thing as a growth system. It does not automatically create visibility, clean service packaging, or year-round demand.</p><p>That model can support a practice for a long time, but it usually keeps the firm reactive. Eventually the firm realizes it has expertise, but not infrastructure.</p>`,
      },
      {
        id: 'limits',
        heading: 'Why referrals hit a ceiling',
        content: `<p>Referrals convert well because borrowed trust hides a lot of structural weakness. A prospect who already believes in you will often tolerate a vague website or a messy intake process. The hidden problem only appears when the practice tries to grow beyond its current circle.</p><p>At that point, the limitations become obvious. The market cannot easily tell who the firm serves, what problem it solves first, or how a new client should begin. Referrals did not solve those problems. They simply covered them up.</p>`,
      },
      {
        id: 'discovery',
        heading: 'Why discovery starts earlier than most firms design for',
        content: `<p>Most prospects do not begin by searching for a tax professional in the language the profession uses. They search for the problem they can currently name — an IRS notice, a transcript question, a payment issue. Discovery starts with symptoms before it starts with solutions.</p><p>Educational content, diagnostic tools, transcript review, and monitoring-oriented offers are effective because they meet prospects at the uncertainty stage. They turn early interest into structured trust instead of waiting for a crisis or a referral to do all the work.</p>`,
      },
      {
        id: 'packaging',
        heading: 'Why packaging matters just as much as visibility',
        content: `<p>Visibility is not enough on its own. Once a prospect lands on the page, the firm still has to explain what happens next. That means the first service step needs to be clear, bounded, and easy to understand.</p><p>Tax professionals often describe services in broad terms because the underlying work is complex. The market responds better to defined entry points. Clear packaging reduces hesitation, sharpens positioning, and makes the business easier to explain.</p>`,
      },
      {
        id: 'monitoring',
        heading: 'Why recurring services change the model',
        content: `<p>Referral channels naturally produce episodic work. There is nothing wrong with that work, but it rarely creates continuity by itself. The result is a business that stays tied to seasonal swings or one-time issues.</p><p>Recurring monitoring changes the economics of the relationship. Instead of waiting for a crisis, the firm stays involved through oversight, review, and earlier intervention. That creates steadier revenue, more frequent client contact, and a clearer reason for the client to remain engaged after the initial matter is resolved.</p>`,
      },
      {
        id: 'ecosystem',
        heading: 'How the ecosystem works together',
        content: `<p>Tax Tools Arcade supports discovery by attracting taxpayers who are still researching questions. Transcripts turns that early interest into diagnostic insight. Tax Monitor creates a recurring service path through monitoring and professional discovery. Virtual Launch Pro gives the firm the infrastructure to package services, onboard clients cleanly, and deliver the work through a more credible operating system.</p><p>Referrals can still sit inside that system, but they are no longer the only engine keeping the whole practice alive.</p>`,
      },
      {
        id: 'shift',
        heading: 'The strategic shift',
        content: `<p>The goal is not to replace referrals. It is to stop depending on them as the only reliable path to growth. When a tax practice can be discovered without luck, understood without a long explanation, and onboarded without chaos, it becomes more stable and more scalable.</p>`,
      },
      {
        id: 'sources',
        heading: 'Sources',
        content: `<p class="text-sm text-white/60"><sup>1</sup> <a href="https://www.thomsonreuters.com/en-us/posts/tax-and-accounting/tax-professionals-report-2024/" target="_blank" rel="noopener noreferrer" class="underline hover:text-orange-400">Thomson Reuters Institute, 2024 State of Tax Professionals Report</a></p><p class="text-sm text-white/60 mt-3"><sup>2</sup> <a href="https://www.irs.gov/tax-professionals/transcript-delivery-system-tds" target="_blank" rel="noopener noreferrer" class="underline hover:text-orange-400">IRS, Transcript Delivery System (TDS)</a></p><p class="text-sm text-white/60 mt-3"><sup>3</sup> <a href="https://www.journalofaccountancy.com/issues/2021/dec/cas-practices-see-20-percent-growth/" target="_blank" rel="noopener noreferrer" class="underline hover:text-orange-400">Journal of Accountancy, CAS Practices See 20% Growth</a></p>`,
      },
    ],
  },
  {
    slug: 'how-structured-onboarding-changes-the-client-experience',
    title: 'How structured onboarding changes the client experience',
    description:
      'How structured onboarding helps tax professionals reduce friction, clarify expectations, improve client confidence, and create a cleaner path into recurring services.',
    category: 'Practice Infrastructure',
    date: '2026-03-10',
    readTime: '8 min read',
    author: 'JLW',
    authorRole: 'EA turned agency builder',
    sections: [
      {
        id: 'introduction',
        content: `<p>For many tax professionals, the client experience begins with a phone call, a few emails, and a request for documents. It feels familiar, so it survives. But familiar is not the same thing as good. This kind of start often creates confusion for clients and extra admin work for the firm.</p><p>Structured onboarding does not mean adding complexity. It means replacing improvised coordination with a defined sequence that both sides can follow.</p>`,
      },
      {
        id: 'hidden-cost',
        heading: 'The hidden cost of unstructured onboarding',
        content: `<p>Unstructured onboarding tends to create the same problems repeatedly. Clients do not fully understand scope. Information arrives incomplete or in inconsistent formats. Staff repeat instructions manually. Work starts before responsibilities are clearly documented.</p><p>Those issues affect both sides. Clients feel uncertainty, which lowers confidence at the worst possible moment, right when trust is still forming. Professionals lose time that should be spent on technical or advisory work.</p>`,
      },
      {
        id: 'what-structured-means',
        heading: 'What structured onboarding actually means',
        content: `<p>Structured onboarding means designing a defined sequence that moves a client from interest to engagement in a predictable way. Each stage should have a specific job: one stage explains the service, another collects information, another documents scope and responsibilities, another confirms payment, another guides the client through what happens after enrollment.</p><p>Instead of relying on memory and repetition, the system itself carries the explanation. Clients move through a process that feels coherent, and the firm stops rebuilding the start of the engagement from scratch every time.</p>`,
      },
      {
        id: 'client-experience',
        heading: 'Why structure improves the client experience',
        content: `<p>Clients do not judge a tax professional only by technical ability. They also judge clarity, consistency, and the feeling that someone has thought through the path ahead. A structured onboarding process sends that signal immediately.</p><p>When onboarding is structured, clients get clearer expectations, more consistent communication, less uncertainty about required documents, and more confidence about what happens next. The first stage of the relationship often defines how the rest of the engagement feels.</p>`,
      },
      {
        id: 'infrastructure-problem',
        heading: 'The infrastructure problem in small practices',
        content: `<p>Most solo and small firms do not resist structured onboarding because they disagree with it. They resist it because building it well takes infrastructure. A working onboarding system usually needs digital intake, engagement documentation, payment collection, file request flow, communication steps, and post-payment task management all connected in a way that makes sense.</p><p>Without that infrastructure, firms end up coordinating everything manually through inboxes, spreadsheets, and disconnected software.</p>`,
      },
      {
        id: 'ecosystem-support',
        heading: 'How the VLP ecosystem supports structured onboarding',
        content: `<p>Virtual Launch Pro is built to address that infrastructure gap. In this ecosystem, onboarding is not treated like an isolated admin task. It becomes part of a larger service system that connects discovery, diagnostics, monitoring, and delivery.</p><p>When those parts work together, onboarding stops being improvised. It becomes a defined stage in a professional client journey. Firms do not just need more leads. They need a cleaner way to convert interest into trust, trust into enrollment, and enrollment into recurring service relationships.</p>`,
      },
      {
        id: 'the-real-shift',
        heading: 'The real shift',
        content: `<p>Tax professionals often focus on getting better at the work, expanding service lines, or finding more clients. Those goals matter. But there is a quieter growth driver underneath all of them: operational structure.</p><p>When onboarding is structured, firms reduce confusion, improve consistency, and create a more credible client experience. They also create the conditions for recurring services, calmer delivery, and better scale.</p>`,
      },
      {
        id: 'sources',
        heading: 'Sources',
        content: `<p class="text-sm text-white/60"><sup>1</sup> <a href="https://www.thomsonreuters.com/en-us/posts/tax-and-accounting/tax-professionals-report-2024/" target="_blank" rel="noopener noreferrer" class="underline hover:text-orange-400">Thomson Reuters Institute, 2024 State of Tax Professionals Report</a><br><br><a href="https://tax.thomsonreuters.com/en/accounting-solutions/practice-forward" target="_blank" rel="noopener noreferrer" class="underline hover:text-orange-400">Thomson Reuters, Practice Forward</a></p><p class="text-sm text-white/60 mt-3"><sup>2</sup> <a href="https://www.aicpa-cima.com/professional-insights/article/pcps-cpa-firm-top-issues-survey" target="_blank" rel="noopener noreferrer" class="underline hover:text-orange-400">AICPA &amp; CIMA, CPA Firm Top Issues Survey</a><br><br><a href="https://www.journalofaccountancy.com/issues/2024/sep/improve-client-experience-in-accounting-firms.html" target="_blank" rel="noopener noreferrer" class="underline hover:text-orange-400">Journal of Accountancy, Client Experience in Accounting Firms</a></p><p class="text-sm text-white/60 mt-3"><sup>3</sup> <a href="https://www.gao.gov/products/gao-06-563t" target="_blank" rel="noopener noreferrer" class="underline hover:text-orange-400">U.S. GAO, Paid Tax Return Preparers</a><br><br><a href="https://quickbooks.intuit.com/r/accountants/accountant-technology-survey/" target="_blank" rel="noopener noreferrer" class="underline hover:text-orange-400">Intuit QuickBooks Accountant Technology Survey</a></p>`,
      },
    ],
  },
]

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
