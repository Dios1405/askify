import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from tickets.models import Ticket, Message, Vote
from knowledge_base.models import Category, Article

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with sample data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Users
        admin = User.objects.create_superuser(
            username='admin', email='admin@helpdesk.com',
            password='admin123', role='admin', first_name='Admin', last_name='User',
        )
        users = []
        for i in range(1, 6):
            u = User.objects.create_user(
                username=f'user{i}', email=f'user{i}@example.com',
                password='pass1234', role='user',
                first_name=f'User', last_name=f'{i}',
            )
            users.append(u)
        self.stdout.write(f'  Created {len(users) + 1} users (admin/admin123)')

        # Knowledge Base
        categories = []
        cat_data = [
            ('Account & Billing', 'Questions about accounts, payments, and subscriptions'),
            ('Technical Support', 'Technical issues and troubleshooting'),
            ('Getting Started', 'Onboarding and setup guides'),
            ('Feature Requests', 'Suggestions and feature requests'),
        ]
        for name, desc in cat_data:
            c = Category.objects.create(name=name, description=desc)
            categories.append(c)

        articles_data = [
            ('How to reset your password', categories[0],
             'Go to Settings > Security > Reset Password. Enter your current password and then your new password twice. Click Save.'),
            ('Setting up two-factor authentication', categories[0],
             'Navigate to Settings > Security > 2FA. Choose your preferred method (SMS or Authenticator app) and follow the on-screen instructions.'),
            ('Troubleshooting login issues', categories[1],
             'If you cannot log in, first try resetting your password. If the issue persists, clear your browser cache and cookies. Contact support if the problem continues.'),
            ('System requirements', categories[1],
             'Our platform supports Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+. A stable internet connection of at least 5 Mbps is recommended.'),
            ('Quick start guide', categories[2],
             'Welcome! Start by creating your profile, then explore the dashboard. Create your first ticket to see how the system works.'),
            ('Understanding ticket priorities', categories[2],
             'Low: General inquiries. Medium: Issues affecting workflow. High: Service degradation. Urgent: Complete service outage.'),
        ]
        for title, cat, content in articles_data:
            Article.objects.create(title=title, content=content, category=cat, author=admin)
        self.stdout.write(f'  Created {len(categories)} categories, {len(articles_data)} articles')

        # Tickets with realistic titles
        ticket_data = [
            ('Cannot login to my account', 'I keep getting a 403 error when trying to login. Tried resetting password but it did not work.'),
            ('Billing charge incorrect', 'I was charged twice for the same month. Please look into this billing issue.'),
            ('Feature request: dark mode', 'It would be nice to have a dark mode option for the dashboard. Easier on the eyes.'),
            ('App crashes on file upload', 'Every time I try to upload a file larger than 5MB, the application crashes completely.'),
            ('Need help setting up integrations', 'How do I connect the Slack integration? The documentation seems outdated.'),
            ('Password reset email not received', 'I requested a password reset 30 minutes ago but have not received any email yet.'),
            ('Dashboard loading slowly', 'The dashboard takes over 10 seconds to load. It used to be much faster.'),
            ('Export function not working', 'When I click export to CSV, nothing happens. No download starts.'),
            ('Request access to admin panel', 'I need admin access to manage our team tickets. Currently I can only see my own.'),
            ('API rate limit too restrictive', 'We are hitting the API rate limit with normal usage. Can this be increased?'),
            ('Mobile app notification issues', 'Push notifications stopped working on iOS after the latest update.'),
            ('Search not returning results', 'The search function returns zero results even for terms I know exist in tickets.'),
            ('Data export in CSV format', 'Is there a way to export ticket data in CSV format for reporting purposes?'),
            ('Unable to change profile picture', 'The profile picture upload gives an error: unsupported format. I am using a PNG file.'),
            ('Two-factor auth not sending codes', 'The 2FA SMS codes stopped arriving. I cannot login without them. This is urgent.'),
        ]

        all_users = users + [admin]
        tickets = []
        messages_created = 0
        votes_created = 0

        for title, desc in ticket_data:
            days_ago = random.randint(1, 45)
            creator = random.choice(users)
            status = random.choice(['open', 'open', 'in_progress', 'in_progress', 'resolved', 'closed'])

            # AI assigns priority based on content
            from tickets.views import ai_assign_priority
            priority = ai_assign_priority(title, desc)

            t = Ticket.objects.create(
                title=title,
                description=desc,
                status=status,
                priority=priority,
                created_by=creator,
                assigned_to=admin if random.random() > 0.4 else None,
            )
            # Manually set created_at
            Ticket.objects.filter(id=t.id).update(created_at=timezone.now() - timedelta(days=days_ago))
            t.refresh_from_db()

            if t.status in ('resolved', 'closed'):
                t.resolved_at = t.created_at + timedelta(hours=random.randint(1, 72))
                t.save()
            tickets.append(t)

            # Add replies from different users
            reply_texts = [
                'Have you tried clearing your browser cache? That usually fixes this.',
                'I had the same issue. Logging out and back in worked for me.',
                'This might be a server-side issue. I would contact support directly.',
                'Try using a different browser to see if the problem persists.',
                'I found that disabling browser extensions fixed this for me.',
                'Check your internet connection. This sometimes happens with slow connections.',
                'This is a known bug. The team is working on a fix.',
                'Can you share your browser version? That might help narrow down the cause.',
                'I resolved this by updating to the latest version of the app.',
                'Same problem here. Hope they fix it soon.',
            ]
            num_replies = random.randint(1, 5)
            for j in range(num_replies):
                sender = random.choice(all_users)
                msg = Message.objects.create(
                    ticket=t,
                    sender=sender,
                    body=random.choice(reply_texts),
                )
                # Manually set time
                Message.objects.filter(id=msg.id).update(
                    created_at=t.created_at + timedelta(hours=random.randint(1, 48))
                )
                messages_created += 1

                # Add votes to some messages
                voters = random.sample(all_users, min(random.randint(0, 4), len(all_users)))
                for voter in voters:
                    if voter != sender:
                        try:
                            Vote.objects.create(user=voter, message=msg)
                            votes_created += 1
                        except:
                            pass

        self.stdout.write(f'  Created {len(tickets)} tickets')
        self.stdout.write(f'  Created {messages_created} replies')
        self.stdout.write(f'  Created {votes_created} votes')
        self.stdout.write(self.style.SUCCESS('Seed complete!'))
