##! Local site policy. Customize as appropriate.
##!
##! This file will not be overwritten when upgrading or reinstalling!

# This script logs which scripts were loaded during each run.
@load misc/loaded-scripts

# Apply the default tuning scripts for common tuning settings.
@load tuning/defaults

# Load the scan detection script.
@load misc/scan

# Log some information about web applications being used.
@load misc/app-stats

# Detect traceroute being run on the network.
@load misc/detect-traceroute

# Generate notices when vulnerable versions of software are discovered.
@load frameworks/software/vulnerable

# Detect software changing (e.g. attacker installing hacked SSHD).
@load frameworks/software/version-changes

# This adds signatures to detect cleartext forward and reverse Windows shells.
@load-sigs frameworks/signatures/detect-windows-shells

# Load all of the scripts that detect software in various protocols.
@load protocols/ftp/software
@load protocols/smtp/software
@load protocols/ssh/software
@load protocols/http/software

# Load all of the scripts that detect malware in various protocols.
@load-sigs frameworks/signatures/detect-MHR

# Framework for adding protocols dynamically.
@load base/frameworks/dpd

# Specific detections
@load protocols/conn/known-hosts
@load protocols/conn/known-services
@load protocols/ssl/known-certs
@load protocols/ssl/known-certs-private
@load protocols/dns/detect-external-names
@load protocols/ftp/detect
@load protocols/http/detect-sqli
@load protocols/http/detect-webapps
@load frameworks/files/hash-all-files

# Integration with Intelligence Framework
@load frameworks/intel/seen
@load frameworks/intel/do_notice

# NDRV1 custom scripts
@load policy/integrations/collective-intel
@load policy/integrations/threat-intel

# JSON logging for NDRV1 integration
@load policy/tuning/json-logs

# Log all connections
redef Conn::log_all_connections = T;

# Set notice action for critical alerts (email, etc.)
hook Notice::policy(n: Notice::Info)
{
    if ( n$note == Intel::Notice || n$note == Attack::Successful )
        add n$actions[Notice::ACTION_EMAIL];
}