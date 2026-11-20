from django.core.management.base import BaseCommand
from registrar.models import sync_clergy_lifecycle


class Command(BaseCommand):
    help = 'Automatically transitions scheduled retirements and records expired contracts into deployment history'

    def handle(self, *args, **options):
        self.stdout.write('Scanning for scheduled retirements and expired contracts...')
        retired, expired = sync_clergy_lifecycle()
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully synchronized {retired} scheduled retirement(s) and {expired} expired contract(s).'
            )
        )

